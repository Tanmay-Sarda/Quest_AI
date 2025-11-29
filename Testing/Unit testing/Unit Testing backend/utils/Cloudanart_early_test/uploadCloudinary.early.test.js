import { uploadCloudinary } from "../cloudanary.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

jest.mock("fs");
jest.mock("cloudinary", () => ({
  v2: {
    config: jest.fn(),  // <-- ADD THIS
    uploader: {
      upload: jest.fn(),
    },
  },
}));


describe("uploadCloudinary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
  });

  test("throws error when filePath is missing", async () => {
    await expect(uploadCloudinary()).rejects.toThrow("File path is required");
  });

  test("throws error when file does not exist", async () => {
    fs.existsSync.mockReturnValue(false);

    await expect(uploadCloudinary("abc.jpg"))
      .rejects.toThrow("File does not exist");
  });

  test("successful upload and file cleanup works", async () => {
    fs.existsSync.mockReturnValue(true);
    fs.unlinkSync.mockImplementation(() => {});

    cloudinary.uploader.upload.mockResolvedValue({ url: "uploaded.jpg" });

    const res = await uploadCloudinary("/tmp/file.jpg");

    expect(res).toEqual({ url: "uploaded.jpg" });

    expect(cloudinary.uploader.upload)
      .toHaveBeenCalledWith("/tmp/file.jpg", { resource_type: "auto" });

    expect(fs.unlinkSync).toHaveBeenCalledWith("/tmp/file.jpg");
  });

  test("cleanup logs error but does not throw when unlinkSync fails", async () => {
    fs.existsSync.mockReturnValue(true);

    fs.unlinkSync.mockImplementation(() => {
      throw new Error("unlink failed");
    });

    cloudinary.uploader.upload.mockResolvedValue({ url: "abc.jpg" });

    await uploadCloudinary("/tmp/file.jpg");

    expect(console.error).toHaveBeenCalledWith(
      "File cleanup failed:",
      "unlink failed"
    );
  });

  test("cloudinary upload failure → cleanup runs → original error re-thrown", async () => {
    fs.existsSync.mockReturnValue(true);

    cloudinary.uploader.upload.mockRejectedValue(new Error("Upload failed"));

    fs.unlinkSync.mockImplementation(() => {}); // cleanup success

    await expect(uploadCloudinary("/tmp/file.jpg"))
      .rejects.toThrow("Upload failed");

    expect(console.error).toHaveBeenCalledWith(
      "Cloudinary Upload Error:",
      "Upload failed"
    );

    expect(fs.unlinkSync).toHaveBeenCalled();
  });

  test("existsSync throws during cleanup → must swallow error & still throw original cloudinary error", async () => {
    // First existsSync (for upload) returns true

    cloudinary.uploader.upload.mockRejectedValue(new Error("Upload failed"));

    fs.unlinkSync.mockImplementation(() => {});

    await expect(uploadCloudinary("/tmp/file.jpg"))
      .rejects.toThrow("Upload failed");

    expect(console.error).toHaveBeenCalledWith(
      "Cloudinary Upload Error:",
      "Upload failed"
    );
  });
});
