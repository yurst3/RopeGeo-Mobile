import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import { TripReport, TripReportMapBlock } from "ropegeo-common/models";
import { TOAST_KEY_MAP_FILE_UPLOAD } from "@/constants/toasts/toastArchetypes";
import { updateSavedTripReport } from "@/utils/tripReport/tripReportStorage";
import { mapFileUploadStore, uploadMapFile, type MapFileUploadTarget } from "../mapFileUpload";

jest.mock("expo-document-picker", () => ({ getDocumentAsync: jest.fn() }));
jest.mock("expo-file-system", () => ({ File: jest.fn() }));
jest.mock("@/utils/tripReport/tripReportStorage", () => ({ updateSavedTripReport: jest.fn() }));

const getDocumentAsync = DocumentPicker.getDocumentAsync as jest.Mock;
const FileMock = File as unknown as jest.Mock;
const updateSavedTripReportMock = updateSavedTripReport as jest.Mock;

const KML = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2"><Document>
  <Placemark><name>Trailhead</name><Point><coordinates>-109.55,38.57</coordinates></Point></Placemark>
  <Placemark><name>Approach</name><LineString><coordinates>-109.55,38.57 -109.54,38.58</coordinates></LineString></Placemark>
  <Placemark><name>Camp</name><Polygon><outerBoundaryIs><LinearRing>
    <coordinates>-109.56,38.56 -109.55,38.56 -109.55,38.57 -109.56,38.56</coordinates>
  </LinearRing></outerBoundaryIs></Polygon></Placemark>
</Document></kml>`;

let fileContents: Record<string, Uint8Array>;
let deletedUris: string[];
let savedReport: TripReport;

function createReport(): { report: TripReport; blockId: string } {
  const block = TripReportMapBlock.createEmpty();
  const report = TripReport.createDraft({ name: "Tester", badgeRank: null, badgeIcon: null })
    .withBlockAdded(block);
  return { report, blockId: block.id };
}

function pickFile(name: string, content?: string): void {
  const uri = `file:///cache/DocumentPicker/${name}`;
  if (content != null) fileContents[uri] = new TextEncoder().encode(content);
  getDocumentAsync.mockResolvedValueOnce({ canceled: false, assets: [{ name, uri }] });
}

function createToast() {
  const shown: { style?: string; message: string; subtitle?: string; durationMs?: number | null }[] =
    [];
  const toast = {
    upsertPill: jest.fn((options) => {
      expect(options.key).toBe(TOAST_KEY_MAP_FILE_UPLOAD);
      shown.push(options);
      return options.key;
    }),
    dismiss: jest.fn(),
  };
  return { toast, shown };
}

function savedMapBlock(blockId: string): TripReportMapBlock {
  const block = savedReport.blocks.find((b) => b.id === blockId);
  if (!(block instanceof TripReportMapBlock)) throw new Error("map block missing");
  return block;
}

beforeEach(() => {
  jest.clearAllMocks();
  fileContents = {};
  deletedUris = [];
  FileMock.mockImplementation((uri: string) => ({
    bytes: async () => {
      const content = fileContents[uri];
      if (content == null) throw new Error(`no file at ${uri}`);
      return content;
    },
    delete: () => deletedUris.push(uri),
  }));
  updateSavedTripReportMock.mockImplementation(
    async (reportId: string, update: (report: TripReport) => TripReport) => {
      if (reportId !== savedReport.id) throw new Error(`No saved trip report with id ${reportId}`);
      savedReport = update(savedReport);
    },
  );
});

describe("uploadMapFile", () => {
  it("imports into the saved report when the map block isn't on screen", async () => {
    const { report, blockId } = createReport();
    savedReport = report;
    const target: MapFileUploadTarget = {
      tripReportId: report.id,
      mapBlockId: blockId,
      newSegmentColor: "white",
    };
    pickFile("trip.kml", KML);
    const { toast, shown } = createToast();
    let uploadingWhileSaving = false;
    updateSavedTripReportMock.mockImplementationOnce(async (_id, update) => {
      uploadingWhileSaving = mapFileUploadStore.uploading;
      savedReport = update(savedReport);
    });

    await uploadMapFile(target, toast);

    const block = savedMapBlock(blockId);
    expect(block.segments.map((segment) => segment.name)).toEqual(["Approach"]);
    expect(block.features.map((feature) => feature.geometry?.type)).toEqual(["Point", "Polygon"]);
    expect(Object.values(block.legend).map((item) => item.name).sort()).toEqual([
      "Camp",
      "Trailhead",
    ]);
    expect(uploadingWhileSaving).toBe(true);
    expect(mapFileUploadStore.uploading).toBe(false);
    expect(shown).toEqual([
      expect.objectContaining({ style: "warning", message: "Map file upload in progress..." }),
      expect.objectContaining({
        style: "success",
        message: "Map file upload finished",
        durationMs: 3000,
      }),
    ]);
    expect(deletedUris).toEqual(["file:///cache/DocumentPicker/trip.kml"]);
  });

  it("hands the import to the map block when it's on screen", async () => {
    const { report, blockId } = createReport();
    savedReport = report;
    const unmount = mapFileUploadStore.mount(blockId);
    pickFile("trip.kml", KML);

    await uploadMapFile(
      { tripReportId: report.id, mapBlockId: blockId, newSegmentColor: "white" },
      createToast().toast,
    );

    expect(updateSavedTripReportMock).not.toHaveBeenCalled();
    const updates = mapFileUploadStore.drain(blockId);
    expect(updates).toHaveLength(1);
    const block = updates[0]!(TripReportMapBlock.createEmpty());
    expect(block.segments).toHaveLength(1);
    expect(block.features).toHaveLength(2);
    expect(mapFileUploadStore.drain(blockId)).toEqual([]);
    unmount();
  });

  it.each([
    ["notes.txt", "hello", ".txt files aren't supported"],
    ["README", "hello", "Files without an extension aren't supported"],
    ["broken.gpx", "not a gpx file", "This isn't a valid GPX file"],
    ["broken.geojson", "{", "This isn't a valid GeoJSON file"],
    [
      "empty.geojson",
      JSON.stringify({ type: "FeatureCollection", features: [] }),
      "The file has no points, lines, or areas",
    ],
  ])("fails %s", async (name, content, subtitle) => {
    const { report, blockId } = createReport();
    savedReport = report;
    pickFile(name, content);
    const { toast, shown } = createToast();

    await uploadMapFile(
      { tripReportId: report.id, mapBlockId: blockId, newSegmentColor: "white" },
      toast,
    );

    expect(shown.at(-1)).toEqual(
      expect.objectContaining({
        style: "error",
        message: "Map file upload failed",
        subtitle,
        durationMs: 5000,
      }),
    );
    expect(updateSavedTripReportMock).not.toHaveBeenCalled();
    expect(mapFileUploadStore.uploading).toBe(false);
  });

  it("fails when the file can't be read", async () => {
    const { report, blockId } = createReport();
    savedReport = report;
    pickFile("missing.kml");
    const { toast, shown } = createToast();

    await uploadMapFile(
      { tripReportId: report.id, mapBlockId: blockId, newSegmentColor: "white" },
      toast,
    );

    expect(shown.at(-1)?.subtitle).toBe("The file couldn't be read");
  });

  it("fails when the map block was removed from the saved report", async () => {
    const { report } = createReport();
    savedReport = report;
    pickFile("trip.kml", KML);
    const { toast, shown } = createToast();

    await uploadMapFile(
      { tripReportId: report.id, mapBlockId: "map-gone", newSegmentColor: "white" },
      toast,
    );

    expect(shown.at(-1)?.subtitle).toBe("The map was removed from the trip report");
  });

  it("fails when the trip report was deleted", async () => {
    const { report, blockId } = createReport();
    savedReport = report;
    pickFile("trip.kml", KML);
    const { toast, shown } = createToast();

    await uploadMapFile(
      { tripReportId: "report-gone", mapBlockId: blockId, newSegmentColor: "white" },
      toast,
    );

    expect(shown.at(-1)?.subtitle).toBe("The trip report was deleted");
  });

  it("does nothing when the picker is canceled", async () => {
    getDocumentAsync.mockResolvedValueOnce({ canceled: true, assets: null });
    const { toast, shown } = createToast();

    await uploadMapFile({ tripReportId: "r", mapBlockId: "m", newSegmentColor: "white" }, toast);

    expect(shown).toEqual([]);
    expect(mapFileUploadStore.uploading).toBe(false);
  });

  it("ignores presses while an upload is already running", async () => {
    let resolvePick: (value: unknown) => void = () => {};
    getDocumentAsync.mockReturnValueOnce(new Promise((resolve) => (resolvePick = resolve)));
    const target = { tripReportId: "r", mapBlockId: "m", newSegmentColor: "white" } as const;
    const { toast } = createToast();

    const first = uploadMapFile(target, toast);
    await uploadMapFile(target, toast);
    resolvePick({ canceled: true, assets: null });
    await first;

    expect(getDocumentAsync).toHaveBeenCalledTimes(1);
  });
});
