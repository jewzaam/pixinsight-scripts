# pixinsight-scripts

Various pixinsight scripts.

# AddStars

Used in conjuction with StarXTerminator.  Assumes the extracted stars are the original image id appending with `_stars`.  Makes it easier to quickly add any stars back into the image they originated from.  Useful to do manipulation of nebula without stars to minimize impact on those stars.

# BetterEzDeconStarmask

Creates a better starmask for EZ Decon.  Uses StarXTerminator to build a starmask and adds it to the starmask created by StarNet.  The binarize process is tweaked from what EZ Decon uses.  Instead of a static threshold of 0.1 it uses the image mean as the reference.  For StarNet it is the actual mean.  For StarXTerminator it is image mean * 4 because it extracts much more faint bits of the star halos.

Note this script copies some functions from EZ Decon and EZ Common scripts.  Only `doBinarize` is modified.  For the original scripts, which you want to have to use this as intended, go to https://darkarchon.internet-box.ch:8443/

# CleanupFITSHeader

Removes all "HISTORY" headers from a FITS file.  Was necessary with older versions of MaskGen script as an example, where that script walked every FITS header looking for some specific things.  This was a big problem with a 19 hour integration of 1 minute subs.  With monochrome and using PixelMath the headers are no longer a problem as they don't survive the creation of color images.

# DustEnhancement

A script written to help bring out dust for Iris Nebula.  Not sure I like it anymore but it did it's job OK.

# FilterIdentifier

Renames the target view to the `FILTER` FITS header.

# PM_AddAll

Applied to an image with an id, script adds all other images that start with that image's id to the image.  Used for building a rejection_low composite after image integration.  This aids in the initial crop of the monochrome frames.

Example, apply to `rejection_low` and will add `rejecction_low1`, `rejection_low2`, etc.