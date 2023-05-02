import fs from "fs/promises";

export function removeFile(path) {
    return new Promise((resolve, reject) => {
        fs.unlink(path, (err) => {
            if (err) {
                reject(err.message);
                return;
            }
            resolve("File deleted successfully");
        });
    });
}
