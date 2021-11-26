import argparse
import os
import tarfile
import hashlib
from datetime import datetime

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Create release artifacts for PixInsight.")
    parser.add_argument("--piversion", type=str, help="minimum supported PixInsight version, default: 1.8.8")
    
    # treat args parsed as a dictionary
    args = vars(parser.parse_args())

    piversion = "1.8.8"
    if "piversion" in args:
        piversion = args["piversion"]
    
    scriptdir = "src\\js"
    filename_tarball = "release\\release.tar.gz"
    filename_template = "src\\template\\updates.xri"
    filename_updates = "release\\updates.xri"

    replacements = {
        "RELEASE_FILENAME": filename_tarball.split("\\")[-1],
        "RELEASE_SHA1": "sha",
        "RELEASE_DATE": datetime.now().strftime("%Y%m%d%H%M%S"),
    }

    # https://stackoverflow.com/questions/2032403/how-to-create-full-compressed-tar-file-using-python 
    # https://stackoverflow.com/questions/2239655/how-can-files-be-added-to-a-tarfile-with-python-without-adding-the-directory-hi 
    with tarfile.open(filename_tarball, "w:gz") as tar:
        for root, _, files in os.walk(scriptdir, topdown=False):
            for name in files:
                tar.add(os.path.join(root, name), arcname=f"astroninja.us\\{name}")
    
    # https://stackoverflow.com/questions/22058048/hashing-a-file-in-python
    # calculate sha1
    sha1 = hashlib.sha1()

    with open(filename_tarball, 'rb') as f:
        while True:
            chunk = f.read(sha1.block_size)
            if not chunk:
                break
            sha1.update(chunk)
    print(f"Created: {filename_tarball}")
    
    replacements["RELEASE_SHA1"] = sha1.hexdigest()

    with open(filename_template, 'r') as ft:
        with open(filename_updates, 'w') as fu:
            while True:
                line = ft.readline()
                if not line:
                    break
                for r in replacements.keys():
                    line = line.replace(f"$({r})", replacements[r])
                fu.write(line)
    print(f"Created: {filename_updates}")


