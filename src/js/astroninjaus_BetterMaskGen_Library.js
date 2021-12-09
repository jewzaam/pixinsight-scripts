//
// MaskGen, generate starmasks from astrometric solution
//
// Copyright Hartmut V. Bornemann, 2017, 2019, 2020, 2021
//
// DMSangle class is Copyright (C) 2012, Andres del Pozo
//                   All rights reserved.
//
// History
//
//       06.11.2021  1.4.3 bug killed and performance improved for loooong FITS headers
//       30.12.2020  1.4.2 Exec button enabled at start
//       30.12.2020  1.4.1 GaiaDR2 process change to GaiaDR3
//       16.11.2020  1.4.0 GaiaDR2 process added
//       07.07.2020  1.3.6 minmag rounding error after download
//       25.04.2020  1.3.5 accept stars without pm.
//       14.01.2020  1.3.4 area calculation, prevent infinite small starfields in download
//       27.12.2019  1.3.3 download segements reorganized
//       21.12.2019  1.3.2 MaskGen directory create in Local path
//       14.12.2019  1.3.0 catalog files restructured
//                         support for elongated stars
//       03.10.2019  1.2.4 BSC5 short version additional catalog added
//       07.09.2019  1.2.3 BSC5 additional catalog prepared
//       05.09.2019  1.2.2 all Gaia sources included
//       22.07.2019  1.2.1 RingMask options inner/outer added
//       21.07.2019  1.2.0 RingMask option added
//       26.06.2019  1.1.5 VOTABLE replaced by plain text format
//                         skip object, if ppm and plx absent
//       17.06.2019  1.1.4 release

#include <pjsr/CryptographicHash.jsh>
#include <pjsr/DataType.jsh>
#include <pjsr/FileMode.jsh>
#include <pjsr/UndoFlag.jsh>

#define Compression_ZLib   1

#define GAIA         "I/345/gaia2" // "GAIA-DR2"
#define MAXMAG       21.7
#define CatFileType  "txt"

#define PSF_status      3
#define PSF_B           4
#define PSF_A           5
#define PSF_cx          6
#define PSF_cy          7
#define PSF_sx          8
#define PSF_sy          9
#define PSF_theta      10
#define PSF_beta       11


var sites = [
             "http://vizier.u-strasbg.fr/",           // (cds) (fr)
             "http://vizier.cfa.harvard.edu/",        // (cfa) (us)
             "http://vizier.hia.nrc.ca/",             // (cadc) (ca)
             "http://vizier.nao.ac.jp/",              // (adac) (jp)
             "http://VizieR.china-vo.org/",           // (bejing) (cn)
             "http://vizier.ast.cam.ac.uk/",          // (cambridge) (uk)
             "http://vizier.inasan.ru/",              // (moscow) (ru)
             "http://www.ukirt.jach.hawaii.edu/",     // (ukirt) (hawaii)
             "http://viziersaao.chpc.ac.za/"
             ];


function gccParms()
{
   // parameters saved in Settings
   //
   this.minMagCat       = 0.0;
   this.maxMagCat       = 12.0;
   this.minMagMask      = 0.0;
   this.maxMagMask      = 12.0;
   this.minRadius       = 1.5;
   this.maxRadius       = 25.0;
   this.maxWidth        = 10;
   this.minWidth        = 1;
   this.allStars        = false;
   this.VizierSite      = sites[0];
   this.version         = "0.0.0";
   this.softEdges       = true;
   this.ringWidthScale  = 0;
   this.ringMask        = false;
   this.dataFolder      = null;

   // load whatever can be loaded
   this.import = function() {
      if (Parameters.has("minMagCat")) {
         this.minMagCat = Parameters.getReal("minMagCat");
      }
      if (Parameters.has("maxMagCat")) {
         this.maxMagCat = Parameters.getReal("maxMagCat");
      }
      if (Parameters.has("minMagMask")) {
         this.minMagMask = Parameters.getReal("minMagMask");
      }
      if (Parameters.has("maxMagMask")) {
         this.maxMagMask = Parameters.getReal("maxMagMask");
      }
      if (Parameters.has("minRadius")) {
         this.minRadius = Parameters.getReal("minRadius");
      }
      if (Parameters.has("maxRadius")) {
         this.maxRadius = Parameters.getReal("maxRadius");
      }
      if (Parameters.has("maxWidth")) {
         this.maxWidth = Parameters.getReal("maxWidth");
      }
      if (Parameters.has("minWidth")) {
         this.minWidth = Parameters.getReal("minWidth");
      }
      if (Parameters.has("allStars")) {
         this.allStars = Parameters.getBoolean("allStars");
      }
      if (Parameters.has("version")) {
         this.version = Parameters.getString("version");
      }
      if (Parameters.has("softEdges")) {
         this.softEdges = Parameters.getBoolean("softEdges");
      }
      if (Parameters.has("ringWidthScale")) {
         this.ringWidthScale = Parameters.getReal("ringWidthScale");
      }
      if (Parameters.has("ringMask")) {
         this.ringMask = Parameters.getBoolean("ringMask");
      }
      if (Parameters.has("dataFolder")) {
         this.dataFolder = Parameters.getString("dataFolder");
      }
   }

   this.export = function() {
      Parameters.set("minMagCat", this.minMagCat);
      Parameters.set("maxMagCat", this.maxMagCat);
      Parameters.set("minMagMask", this.minMagMask);
      Parameters.set("maxMagMask", this.maxMagMask);
      Parameters.set("minRadius", this.minRadius);
      Parameters.set("maxRadius", this.maxRadius);
      Parameters.set("maxWidth", this.maxWidth);
      Parameters.set("minWidth", this.minMagCat);
      Parameters.set("allStars", this.allStars);
      // Parameters.set("VizierSite", parms.VizierSite);
      Parameters.set("version", this.version);
      Parameters.set("softEdges", this.softEdges);
      Parameters.set("ringWidthScale", this.ringWidthScale);
      Parameters.set("ringMask", this.ringMask);
      Parameters.set("dataFolder", this.dataFolder);
   }

   // trigger import on construction
   this.import();

   return this;
}

function cControl(imageWindow, parms, dialog)
{
   this.boxArea = 0;
   this.boxes = [];
   this.catalogName = GAIA;
   this.columns = ['ra', 'dec', 'Gmag', 'pmRA', 'pmDE'];
   this.coneArea = 0;
   this.dataExec = null;
   this.dataVizieR = null;
   this.dataGaiaDR3 = null;
   this.dec = 0;
   this.dialog = dialog;
   this.download = false;
   this.height = 0;
   this.id = '';
   this.image = null;
   this.inner = true;
   this.julianDay = 2451545.0;
   this.mask = null;
   this.pixelMap = null;
   this.PixInsightRoot = ""; // C:\Program Files\PixInsight
   this.progress = -1;
   this.R = null;
   this.ra = 0;
   this.radius = 0; // degrees (NEW)
   this.resolution = 0;
   this.ringMask = false;
   this.starsInMags = 0;
   this.starsPainted = 0;
   this.sx = 0;
   this.sy = 0;
   this.theta = 0;
   this.usePSF = false;
   this.width = 0;
   this.window = imageWindow;
   this.years = 0;
   this.GaiaDR3enabled = false;
   this.GaiaDR3using = false;
   this.GaiaDR3File = '';
   
   this.init = function(dataFolder) {
      if (this.window != null) {
         this.image       = this.window.mainView.image;
         this.width       = this.image.width;
         this.height      = this.image.height;
         var pos          = getImageEQPosition(this.window);
         this.id          = getKeyString(this.window, 'OBJECT');
         if (this.id == null) 
            this.id = 'unknown';
         this.ra          = pos.x;
         this.dec         = pos.y;
         this.resolution  = getImageResolution(this.window);

         this.GaiaDR3enabled = TypeDescription.externalObjects.indexOf("Gaia") > -1;

         Console.writeln('GaiaDR3enabled '+ this.GaiaDR3enabled);

         this.GaiaDR3using = this.GaiaDR3enabled;

         this.radius      = Math.sqrt(Math.pow(this.width / 2, 2) 
                              + (Math.pow(this.height / 2, 2)))
                              * this.resolution;

         Console.writeln('Dec:\t' + DMSangle.FromAngle(this.dec).ToString(true),
                  '\tRa:\t'+ DMSangle.FromAngle(this.ra / 15).ToString(true) +
                  '\nRadius:\t' + this.radius.toFixed(4));

         this.coneArea    = this.radius * this.radius * Math.PI / 3600;
         this.progress    = 0;

         this.dataVizieR  = new MaskGenData(dataFolder, this.id, this.ra, this.dec);
         //
         // if data is new, begin loading stars from BSC5
         //
         var fdBSC5 = null;
         var index  = -1;
         for (var i in this.dataVizieR.getDataInfo().filedescriptors)
         {
            if (this.dataVizieR.getDataInfo().filedescriptors[i].source == 'BSC5')
            {
               fdBSC5 = this.dataVizieR.getDataInfo().filedescriptors[i];
               index = i;
               break;
            }
         }
         if (fdBSC5 == null && this.dataVizieR.getDataInfo().filedescriptors.length == 0)
         {
            // try new BSC5 data
            var bsc5 =  File.systemTempDirectory + '/bsc5.txt';
            writeBSC5(this.ra, this.dec, this.radius, bsc5);
            if (File.exists(bsc5))
            {
               var binfile = dataFolder + '/' + this.dataVizieR.baseFile +
                              '[' + this.dataVizieR.getnextIndex().toString() + '].bin';

               this.dataVizieR.addNewDescriptor(fileDescriptor(binfile, false, '', 0, 0, 'BSC5',
                              0, 0, 0, [0, 0], 0))

               this.dataVizieR.fillDescriptor(0, bsc5)
               File.remove(bsc5);
            }
         }
         if (fdBSC5 != null && !fdBSC5.valid)
         {
            // try refresh BSC5 data
            var bsc5 =  File.systemTempDirectory + '/bsc5.txt';

            writeBSC5(this.ra, this.dec, this.radius, bsc5);
            if (File.exists(bsc5))
            {
               var binfile = dataFolder + '/' + this.dataVizieR.baseFile +
                              '[' + this.dataVizieR.getnextIndex().toString() + '].bin';

               this.dataVizieR.fillDescriptor(index, bsc5);

               Console.writeln('BSC5 updated for this mask');
               File.remove(bsc5);
            }
         }
         
         this.boxes = generateBoxes(this.window);

         for (var i in this.boxes) this.boxArea += this.boxes[i].area;

         var dateObs = getKeyString(this.window, "DATE-OBS");
         if (dateObs == null)
         {
            var fi = new FileInfo(this.window.filePath);
            if (fi.exists)
            {
               var isoStr = fi.lastModified.toISOString();
               dateObs = isoStr.substr(0, 10);
            }
            else
               {
                  var date = new Date(Date.now());
                  dateObs  = date.toISOString().split('T')[0];
               }
         }
         var t = dateObs.indexOf("T");
         if (t > -1) dateObs = dateObs.substring(0, t);
      
         this.julianDay = JulianDay(dateObs);

         this.years = (this.julianDay - 2451545.0) / 365.25;
      }
   }

   // trigger init on construction
   this.init(parms.dataFolder);

   return this;
}

function autoMaskGen(window, maskId) {
   var parms = gccParms();
   Console.writeln(parms.maxWidth)
   var cc = cControl(window, parms, null);
   var keywords = [];

   return MaskGen_execute(cc, parms, maskId, keywords);
}

function MaskGen_execute(cc, parms, maskId, keywords) {
   cc.window.regenerateAstrometricSolution();

   // setup dataFolder
   if (parms.dataFolder == null || !File.directoryExists(parms.dataFolder))
   {
      parms.dataFolder = File.systemTempDirectory + '/MaskGen';
      if (!File.directoryExists(parms.dataFolder))
      {
         File.createDirectory(parms.dataFolder, true);
         Console.writeln('Folder created: ' + parms.dataFolder);
      }
   }

   if (cc.GaiaDR3using) {
      loadLocalDR3(cc, parms);
      cc.dataExec = new XGaiaDR3File(cc.GaiaDR3File);
   } else {
      cc.dataExec = cc.dataVizieR;
   }

   parms.ringMask = false;

   var view = maskView(cc, parms, maskId, keywords);
   if (view == null)
   {
      errMessage('No mask created');
      return null;
   }

   if (cc.ringMask)
   {
      parms.ringMask = true;
      var view_temp = maskView(cc, parms, "temp_mask", keywords);
      if (view_temp == null)
      {
         errMessage('No mask created');
         return null;
      }

      var P = new PixelMath;
      if (cc.inner)
         P.expression = '$T * ~' + view_temp.id;
      else
         P.expression = '~$T * ' + view_temp.id;
      P.expression1 = "";
      P.expression2 = "";
      P.expression3 = "";
      P.useSingleExpression = true;
      P.symbols = "";
      P.generateOutput = true;
      P.singleThreaded = false;
      P.use64BitWorkingImage = false;
      P.rescale = false;
      P.rescaleLower = 0;
      P.rescaleUpper = 1;
      P.truncate = true;
      P.truncateLower = 0;
      P.truncateUpper = 1;
      P.createNewImage = false;
      P.showNewImage = false;
      P.newImageId = "";
      P.newImageAlpha = false;
      P.newImageColorSpace = PixelMath.prototype.Gray;
      P.newImageSampleFormat = PixelMath.prototype.f32;
      P.executeOn(view, false);
      view_temp.window.forceClose();
   }

   view.window.show();

   Console.writeln("Mask id created:  " + view.id);
   Console.writeln("Stars painted:    " + cc.starsPainted);
   Console.writeln("Stars within mag: " + cc.starsInMags);

   return view;
}

function nextMagRangeToEdit(minEdit, maxEdit, cc, parms)
{
   //
   // propose magnitudes
   //
   var dataInfo = cc.dataVizieR.getDataInfo();
   //
   // find max mag in files
   //
   if (dataInfo.maxMag == 0)
   {
      parms.minMagCat = 0;
      parms.maxMagCat = 12;
   }
   else
   {
      parms.minMagCat = Math.min(MAXMAG - 0.1, dataInfo.maxMag);
      parms.maxMagCat = Math.min(MAXMAG, parms.minMagCat + 1);
      minEdit.text = parms.minMagCat.toFixed(2);
      maxEdit.text = parms.maxMagCat.toFixed(2);
   }
}

function maskView(cc, parms, maskId, keywords)
{
   cc.mask         = null;
   cc.starsPainted = 0;
   cc.starsInMags  = 0;

   generate(cc, parms);

   if (cc.mask == null) return null;

   keywords.push(new FITSKeyword("STARS", cc.starsPainted.toString(), "Stars painted"));

   if (parms.softEdges)
      keywords.push(new FITSKeyword("MASKTYPE", "'Soft'",
         "stars painted with interpolated edges"));
   else
      keywords.push(new FITSKeyword("MASKTYPE", "'Binary'",
         "stars painted as true binary mask"));

   if (cc.GaiaDR3using)
   {
   }
   else
   {
      keywords.push(new FITSKeyword("MASKDATA", '\'' +
         File.extractName( cc.dataVizieR.getJSONFile()) + '\'',
         "JSON formatted data descriptor"));
   }

   var maskWin = new ImageWindow(cc.width, cc.height, 1, 32, true, false, maskId);
   maskWin.mainView.beginProcess(UndoFlag_NoSwapFile);
   maskWin.keywords = keywords;
   maskWin.mainView.image.apply(cc.mask);
   maskWin.mainView.endProcess();

   maskWin.show();
   return maskWin.mainView;
}

function generate(cc, parms)
{
   var minMag = parms.minMagMask - 0.0005;
   var maxMag = parms.maxMagMask + 0.0005;

   if (cc.GaiaDR3using)
   {
      Console.writeln("\nStart painting Gaia from GaiaDR3 process");
   }
   else
   {
      Console.writeln("\nStart painting Gaia download(s) from VizieR and BSC5");
   }
   var dataInfo = cc.dataExec.getDataInfo();
   Console.writeln("Catalog magnitude range: " + dataInfo.minMag + ".." + dataInfo.maxMag);
   Console.writeln("Catalog files count:     " + dataInfo.filedescriptors.length );
   Console.writeln("Catalog record count:    " + dataInfo.records );

   Console.writeln("Painting mag range:      " + minMag.toFixed(3) + ".." + maxMag.toFixed(3));
   Console.flush();

   var mat = new Matrix(cc.height, cc.width);

   var intensities = null;
   if (parms.softEdges && !cc.ringMask)
      intensities = [0, 0.25, 0.5, 0.75, 1];       // soft
   else
      intensities = [0, 1, 1, 1, 1, 1];            // binary

   var R = new Rect(0, 0, cc.width - 1, cc.height - 1);

   cc.dataExec.open();

   while (true)
   {
      var rec = cc.dataExec.read();
      if (rec == null) break;

      if (rec.Gmag < minMag) continue;
      if (rec.Gmag > maxMag) continue;

      cc.starsInMags += 1;

      var deltaRa = rec.pmRA / Math.cos(rec.dec * Math.RAD) * cc.years / 3600000.0;
      var deltaDe = rec.pmDE * cc.years / 3600000.0;

      var ra  = rec.ra;
      var dec = rec.dec

      ra  += deltaRa;
      dec += deltaDe;

      while (ra >= 360) ra -= 360;
      while (ra < 0)    ra += 360;

      var p = null;

      try
      {
         p = cc.window.celestialToImage(ra, dec);
      }
      catch (ex)
      {
         Console.writeln(ex + '\t' + ra + '\t' + dec);
      }

     // Console.writeln(p + '\t' + ra.toFixed(6) + '\t' + dec.toFixed(6) + '\t' + rec.Gmag);

      if (p == null) continue;

      var r = radiusOfMag(rec.Gmag, parms);

      if (r < 1) r = 1;

      if (cc.usePSF)
      {
         //
         // ellipsoidal mask
         //
         var ringWidth = 0;
         if (parms.ringMask)
         {
            if (cc.inner)
               ringWidth = -widthOfMag(rec.Gmag, parms);
            else
               ringWidth =  widthOfMag(rec.Gmag, parms);
         }

         var ellips = new ellipsoid(p.x, p.y,
                                    r * cc.sx / cc.sy + ringWidth,
                                    r + ringWidth,
                                    cc.theta, cc.image);
         if (ellips.rect == null) continue;

         var rect = ellips.rect;
         for (var y = rect.y0; y < rect.y1; y++)
         {
            for (var x = rect.x0; x < rect.x1; x++)
            {
               var count = pixVertices(ellips, x , y );
               var a = intensities[count];
               var b = mat.at(y, x);            // old mask value
               var v = Math.min(1, a + b);      // add a and clip to 1
               mat.at(y, x, v);                 // save
            }
         }
         cc.starsPainted += 1;
      }
      else
      {
         //
         // circular mask
         //
         if (parms.ringMask)
         {
            if (cc.inner)
               r -= widthOfMag(rec.Gmag, parms);
            else
               r += widthOfMag(rec.Gmag, parms);
         }

         var rect = new Rect(Math.floor(p.x - r),
                             Math.floor(p.y - r),
                             Math.ceil (p.x + r),
                             Math.ceil (p.y + r));

         if (!R.intersects(rect)) continue;

         var rect = R.intersection(rect);

         for (var y = rect.y0; y < rect.y1; y++)
         {
            for (var x = rect.x0; x < rect.x1; x++)
            {
               //
               // get intersection of circle with pixel
               //
               var a = Pixwt(p.x , p.y , r , x, y);
               if (parms.softEdges)
               {
                  //
                  // add intensity
                  //
                  var b = mat.at(y, x);            // old mask value
                  var v = Math.min(1, a + b);      // add a and clip to 1
                  mat.at(y, x, v);                 // save
               }
               else
               {
                  //
                  // binary mask
                  //
                  if (a < 0.5) continue;
                  mat.at(y, x, 1);
               }
            }
         }
         cc.starsPainted += 1;
      }
   }

   cc.mask = mat.toImage();
   cc.dataExec.close();        //ctr.close();
}

function radiusOfMag(mag, parms)
{
   //var radius = parms.maxRadius - Math.log(mag + 1) * parms.radiusScale;
   with (parms)
   {
      var log1   = 1 + mag - minMagMask;
      if (log1 < 1) log1 = 1;

      var radius = maxRadius - Math.log(log1) * (maxRadius - minRadius) /
                     Math.log(1 + maxMagMask - minMagMask);

      if (mag < 6)
      {
         Console.writeln("Radius "+radius);
      }

      return radius;
   }
}

function widthOfMag(mag, parms)
{
   var width = parms.maxWidth - Math.log(mag + 1) * parms.ringWidthScale;
   return width;
}

function magToRadius(cc, parms)
{
   // find a star near mag and return its radius
   //
   var mag = parms.minMagMask;
   var imgR = new Rect(12, 12, cc.width - 24, cc.height - 24);
   var minPos =  {pos:new Point(), mag: 99, radius:0};
   //var dataInfo = cc.data.getDataInfo();
   //cc.data.open();
   if (cc.GaiaDR3using)
   {
      loadLocalDR3(cc, parms);
      cc.dataExec = new GaiaDR3File(cc.GaiaDR3File);
   }
   else
   {
      cc.dataExec = cc.dataVizieR;
   }
   cc.dataExec.open();
   var m = Number.MAX_VALUE;
   while (true)
   {
      //var rec = cc.data.read();
      var rec = cc.dataExec.read();
      if (rec == null) break;

      var deltaRa = rec.pmRA / Math.cos(rec.dec * Math.RAD) * cc.years / 3600000.0;
      var deltaDe = rec.pmDE * cc.years / 3600000.0;

      var ra  = rec.ra;
      var dec = rec.dec
      ra  += deltaRa;
      dec += deltaDe;

      while (ra >= 360) ra -= 360;
      while (ra < 0)    ra += 360;

      var p = null;

      try
      {
         p = cc.window.celestialToImage(ra, dec);
      }
      catch (ex)
      {
         Console.writeln(ex + '\n' + ra + '\t' + dec);
      }

      if (p == null) continue;

      if (!imgR.includes(p)) continue;

      var diff = Math.abs(rec.Gmag - mag);

      if (diff < m)
      {
         minPos.mag = rec.Gmag;
         minPos.pos = p;
         m = diff;
         //Console.writeln(minPos.mag + ' @ ' + p + ' ' + rec.ra+'d'+rec.dec+'d');
      }
   }
   //cc.data.close();
   cc.dataExec.close();

   var P = new DynamicPSF;
   var r = P.searchRadius;

   P.views = [ // id
      [ cc.window.mainView.id ]
   ];
   var x = minPos.pos.x;
   var y = minPos.pos.y;
   Console.writeln('Pos: ' + x + '\t' + y + x +  '\t' + minPos.mag);
   P.stars = [ // viewIndex, channel, status, x0, y0, x1, y1, x, y
   [0, 0, DynamicPSF.prototype.Star_DetectedOk, x - r, y - r, x + r, y + r, x, y]
   ];
   P.psf = [ // starIndex, function, circular, status, B, A, cx, cy, sx, sy, theta, beta, mad, celestial, alpha, delta
   ];
   P.autoPSF = true;
   P.circularPSF = false;
   P.gaussianPSF = true;
   P.moffatPSF = false;
   P.moffat10PSF = false;
   P.moffat8PSF = false;
   P.moffat6PSF = false;
   P.moffat4PSF = false;
   P.moffat25PSF = false;
   P.moffat15PSF = false;
   P.lorentzianPSF = false;
   P.signedAngles = true;
   P.regenerate = true;
   P.astrometry = true;
   P.searchRadius = 8;
   P.threshold = 1.00;
   P.autoAperture = true;
   P.scaleMode = DynamicPSF.prototype.Scale_Pixels;
   P.scaleValue = 1.00;
   P.scaleKeyword = "";
   P.starColor = 4292927712;
   P.selectedStarColor = 4278255360;
   P.selectedStarFillColor = 0;
   P.badStarColor = 4294901760;
   P.badStarFillColor = 2164195328;

   if (P.executeGlobal())
   {
      Console.writeln('P.psf.length  '+P.psf.length);
      for (var i in P.psf)
      {
         var psfRow = P.psf[i];
         if (psfRow[PSF_status] == DynamicPSF.prototype.PSF_FittedOk)
         {
            //minPos.radius = psfRow[PSF_sx];   // max. axis
            var sx = psfRow[PSF_sx];
            minPos.radius = 2.35482 * sx;       // FWHM
            Console.writeln('Star @ ' + psfRow[PSF_cx] + ', ' + psfRow[PSF_cy] +
               ', sx = ' + sx + ', radius = ' + minPos.radius);
         }
      }
   }
   else
   {
      Console.writeln('P.executeGlobal()  failed');
   }
   return minPos;
}

function getImageEQPosition(window)
{
   if (window.astrometricSolution().length > 0)
   {
      var CRVAL1 = getKeyValue(window, "CRVAL1");
      var CRVAL2 = getKeyValue(window, "CRVAL2");
      if (getKeyString(window,"CTYPE1") == "RA---TAN") return new Point(CRVAL1, CRVAL2);
      else return new Point(CRVAL2, CRVAL1);
   }
   else
      return new Point(-2, -1);
}

function getImageResolution(window)
{
   if (window.astrometricSolution().length > 0)
   {
      var CDELT1 = getKeyValue(window, "CDELT1");
      var CDELT2 = getKeyValue(window, "CDELT2");
      return (Math.abs(CDELT1) + Math.abs(CDELT2)) / 2;
   }
   else
      return 0;
}


function astrometricSolution(keys)
{
   //Console.writeln(keys);
   for (var i in keys)
   {
      var k = new FITSKeyword(keys[i]);
      if (k.isString)
         this[k.name] = k.strippedValue ;
      else if (k.isNumeric)
         this[k.name] = k.value.toNumber();
      else
         this[k.name] = k.value;
   }
}

function catalogGridView(cc, treebox)
{
   //
   // view cataloG files in treeBox
   //
   treebox.clear();
   var dataInfo = cc.dataVizieR.getDataInfo();
   for (var i = 0; i < dataInfo.filedescriptors.length; i++)
   {
      var fd = dataInfo.filedescriptors[i];
      var tn = new TreeBoxNode();

      var c = 0;

      if (fd.valid)
      {
         tn.setIcon(c++, cc.dialog.scaledResource(":/icons/check.png"));
      }
      else
      {
         tn.setIcon(c++, cc.dialog.scaledResource(":/file-explorer/delete.png"));
      }

      tn.setText(c++, i.toString());

      if (fd.records == 0)
      {
         tn.setText(c++, '-');
         tn.setText(c++, '-');
      }
      else
      {
         tn.setText(c++, fd.minMag.toFixed(3));
         tn.setText(c++, fd.maxMag.toFixed(3));
      }

      tn.setText(c++, fd.records.toString());

      tn.setText(c++, fd.source);

      tn.setAlignment(0, 3);
      tn.setAlignment(1, Align_Right);
      tn.setAlignment(2, Align_Right);
      tn.setAlignment(3, Align_Right);
      tn.setAlignment(4, Align_Right);
      tn.setAlignment(5, Align_Left);

      //tn.selectable = false;

      with (fd)
      {
         var tooltip = '<b>Catalog subset #' + (i + 1).toString()
                                                   + '</b>' +
            '<p>Source  : ' + source + '</p>' +
            '<p>Filename: ' + binfile + '</p>' +
            '<p>minMag  : ' + minMag + '</p>' +
            '<p>maxMag  : ' + maxMag + '</p>' +
            '<p>Stars   : ' + records + '</p>';

            if (radius > 0)
               tooltip += '<p>Radius  : ' + radius.toFixed(3) + '°</p>';
            else
               tooltip += '<p>Box     : ' + box[0].toFixed(3) + 'x' +
                                            box[1].toFixed(3) +'°</p>';

         tn.setToolTip(0, tooltip);
      }

      treebox.add(tn);
   }
}

function downloadSegments(data, columns, site, allStars, recall)
{
   //
   // download one file per segment with valid = false
   //
   var dataInfo = data.getDataInfo();
   var numDownloads = 0;
   var downloaded   = 0;
   for (var i = 0; i < dataInfo.filedescriptors.length; i++)
   {
      if (!dataInfo.filedescriptors[i].valid) numDownloads += 1;
   }
   for (var i = 0; i < dataInfo.filedescriptors.length; i++)
   {
      var fd = dataInfo.filedescriptors[i];
      //
      if (fd.valid) continue;
      //
      var tempFile = File.systemTempDirectory+ '/GaiaDownload.txt';
      if (File.exists(tempFile)) File.remove(tempFile);

      if ( downloadBox(fd, columns, tempFile, site, allStars) )
      {
         data.fillDescriptor (i, tempFile);

         //var copy = tempFile.replace('.txt', '_' + i.toString() + '.txt');

         //if (File.exists(copy)) File.remove(copy);

         //File.copyFile(copy, tempFile);

         File.remove(tempFile);

         downloaded += 1;
         recall (numDownloads, downloaded);
      }
      else
         return false;
   }
   return true;
}

// *******************************************************************************
//
// load catalog extract from web catalog service
//
// *******************************************************************************
function downloadBox(filedescriptor, columns, tempFile, site, allStars)
{
   //
   // http://vizier.u-strasbg.fr/vizier/doc/vizquery.htx
   //
   Console.writeln("Start download "+ tempFile);

   var strConstraints = "Gmag=" + filedescriptor.minMag.toFixed(2) + ".." +
                                  filedescriptor.maxMag.toFixed(2);

   var url = site + "viz-bin/asu-txt/?-source=" +
      filedescriptor.source +
      "&-c.ra=" + filedescriptor.ra.toFixed(11) +
      "&-c.dec=" + filedescriptor.dec.toFixed(11) +
      "&-c.bd=" + filedescriptor.box[0].toFixed(11) + 'x' +
                  filedescriptor.box[1].toFixed(11) +
      "&-out.max=unlimited" +
      "&-out=" + columns.join(',');
      if (!allStars && strConstraints != "") url += '&' + strConstraints;
   var downloader = new FileDownload( url, tempFile );
   Console.writeln("Download "+ tempFile);
   Console.writeln(url);
   Console.flush();
   var result = false;
   try
   {
      result = downloader.perform();
   }
   catch (ex)
   {
      Console.writeln('\nDownload failed: ' + ex + '\nresult: ' + result);
   }
   if (result)
   {
      return File.exists(tempFile);
   }

   return result;
}


function errMessage(txt)
{
   var id = "MaskGen";
   Console.warningln(format("%s: %s", id, txt))
   new MessageBox(txt, id, StdIcon_Error).execute();
}

function angularSeparation(ra1, de1, ra2, de2)
{
   // degrees to radiant
   var a1 = ra1 * Math.RAD;
   var a2 = ra2 * Math.RAD;
   var d1 = de1 * Math.RAD;
   var d2 = de2 * Math.RAD;
   var z  = Math.acos(Math.sin(d1) * Math.sin(d2) + Math.cos(d1) * Math.cos(d2) * Math.cos(a1 - a2));
   var d  = Math.abs(z) * Math.DEG;
   return d % 360.0;
}

// ---------------------------------------------------------------------------
// FUNCTION Pixwt( xc, yc, r, x, y )
//
// Compute the fraction of a unit pixel that is interior to a circle.
// The circle has a radius r and is centered at (xc, yc). The center of
// the unit pixel (length of sides = 1) is at (x, y).
// ---------------------------------------------------------------------------
function Pixwt(xc , yc , r , x, y)
{
	var weight  = Intarea(xc, yc, r, x - 0.5, x + 0.5, y - 0.5, y + 0.5);
	if (weight < 0.00000001 ) weight = 0.0;
	return weight;
}
// ---------------------------------------------------------------------------
// Function Intarea( xc, yc, r, x0, x1, y0, y1 )
//
// Compute the area of overlap of a circle and a rectangle.
// xc, yc : Center of the circle.
// r : Radius of the circle.
// x0, y0 : Corner of the rectangle.
// x1, y1 : Opposite corner of the rectangle.
// ---------------------------------------------------------------------------
function Intarea(xc , yc , r , x0 , x1 , y0 , y1 )
{
	//
	// Shift the objects so that the circle is at the origin.
	//
	x0 = x0 - xc;
	y0 = y0 - yc;
	x1 = x1 - xc;
	y1 = y1 - yc;

	return Oneside(x1, y0, y1, r) + Oneside(y1, -x1, -x0, r) +
		Oneside(-x0, -y1, -y0, r) + Oneside(-y0, x0, x1, r);
}
// ---------------------------------------------------------------------------
// Function Oneside( x, y0, y1, r )
//
// Compute the area of intersection between a triangle and a circle.
// The circle is centered at the origin and has a radius of r. The
// triangle has verticies at the origin and at (x,y0) and (x,y1).
// This is a signed area. The path is traversed from y0 to y1. If
// this path takes you clockwise the area will be negative.
// ---------------------------------------------------------------------------
function Oneside(x , y0 , y1 , r )
{

	if (x == 0) return x;
	if (Math.abs(x) >= r) return Arc(x, y0, y1, r);
	var yh  = Math.sqrt(r * r - x * x);

	if (y0 <= -yh)
	{
		if (y1 <= -yh)
			return Arc(x, y0, y1, r);

		if (y1 <= yh)
			return Arc(x, y0, -yh, r) + Chord(x, -yh, y1);
		else
		return Arc(x, y0, -yh, r) + Chord(x, -yh, yh) + Arc(x, yh, y1, r);
	}

	if (y0 < yh)
	{
		if (y1 <= -yh)
			return Chord(x, y0, -yh) + Arc(x, -yh, y1, r);

		if (y1 <= yh)
			return Chord(x, y0, y1);
		else
			return Chord(x, y0, yh) + Arc(x, yh, y1, r);

	}

	if (y1 <= -yh)
		return Arc(x, y0, yh, r) + Chord(x, yh, -yh) + Arc(x, -yh, y1, r);

	if (y1 <= yh)
		return Arc(x, y0, yh, r) + Chord(x, yh, y1);
	else
		return Arc(x, y0, y1, r);

}
// ---------------------------------------------------------------------------
// Function Chord( x, y0, y1 )
//
// Compute the area of a triangle defined by the origin and two points,
// (x,y0) and (x,y1). This is a signed area. If y1 > y0 then the area
// will be positive, otherwise it will be negative.
// ---------------------------------------------------------------------------
function Chord(x , y0 , y1 )
{
	return 0.5 * x * (y1 - y0);
}

// ---------------------------------------------------------------------------
// Function Arc( x, y0, y1, r )
//
// Compute the area within an arc of a circle. The arc is defined by
// the two points (x,y0) and (x,y1) in the following manner: The circle
// is of radius r and is positioned at the origin. The origin and each
// individual point define a line which intersects the circle at some
// point. The angle between these two points on the circle measured
// from y0 to y1 defines the sides of a wedge of the circle. The area
// returned is the area of this wedge. If the area is traversed clockwise
// then the area is negative, otherwise it is positive.
// ---------------------------------------------------------------------------
function Arc(x , y0 , y1 , r )
{
	return 0.5 * r * r * (Math.atan((y1) / (x)) - Math.atan((y0) / (x)));
}


function JulianDay(ISODate)
{
   var d = new Date(ISODate);
   var y = d.getFullYear();
   var m = d.getMonth();
   var D = d.getDay();
   var M = m + 12;
   if (m > 2) M = m;
   var Y = y - 1;
   if (m > 2) Y = y;
   var B = 0;  //Julian calendar
   return Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + D + B - 1524.5;
}

// ******************************************************************
// DMSangle: Helper class for simplifying the use of angles in DMS format
// ******************************************************************
function DMSangle()
{
   this.deg = 0;
   this.min = 0;
   this.sec = 0;
   this.sign = 1;

   this.GetValue = function()
   {
      return this.sign*(this.deg + this.min/60 + this.sec/3600);
   };

   this.ToString = function( hours )
   {
      var plus = hours ? "" : "+";
      if ( this.deg != null && this.min != null && this.sec != null && this.sign != null )
         return ((this.sign < 0) ? "-": plus) +
               format( "%02d %02d %0*.*f", this.deg, this.min, hours ? 6 : 5, hours ? 3 : 2, this.sec );
      return "<* invalid *>";
   };
}


DMSangle.FromString = function( coordStr, mindeg, maxdeg )
{
   var match = coordStr.match( "'?([+-]?)([0-9]*)[ :]([0-9]*)[ :]([0-9]*(.[0-9]*)?)'?" );
   if( match==null )
      return null;
   var coord = new DMSangle();
   if ( match.length < 4 )
      throw new Error( "Invalid coordinates" );
   coord.deg = parseInt( match[2], 10 );
   if ( coord.deg < mindeg || coord.deg > maxdeg )
      throw new Error( "Invalid coordinates" );
   coord.min = parseInt( match[3], 10 );
   if ( coord.min < 0 || coord.min >= 60 )
      throw new Error( "Invalid coordinates (minutes)" );
   coord.sec = parseFloat( match[4] );
   if ( coord.sec < 0 || coord.sec >= 60 )
      throw new Error( "Invalid coordinates (seconds)" );
   coord.sign = (match[1] == '-') ? -1 : 1;
   return coord;
}

DMSangle.FromAngle = function (angle)
{
   var coord = new DMSangle();
   if (angle < 0)
   {
      coord.sign = -1;
      angle = -angle;
   }
   coord.deg = Math.floor(angle);
   coord.min = Math.floor((angle - coord.deg) * 60);
   coord.sec = (angle - coord.deg - coord.min / 60) * 3600;

   if (coord.sec > 59.999)
   {
      coord.sec = 0;
      coord.min++;
      if (coord.min == 60)
      {
         coord.min = 0;
         coord.deg++;
      }
   }

   return coord;
}


// *****************************************************************************
//
// Subframes
//
// *****************************************************************************
function generateBoxes(window)
{
   // return a collection of boxes for download
   var view   = window.mainView;
   var image  = view.image;
   var border = 16;
   var c00 = window.imageToCelestial(-border, -border);
   var c01 = window.imageToCelestial(image.width + border, -border);
   var c10 = window.imageToCelestial(-border, image.height + border);
   var c11 = window.imageToCelestial(image.width + border, image.height + border);

   var mm = miniMax(c00, c01, c10, c11);

   var boxes = splitArea(mm);
/*
   for (var i in boxes)
   {
      with (boxes[i])
      {
         Console.writeln('box: '+ i+'\t'+ra.toFixed(6)+'\t'+dec.toFixed(6)+
         '\t'+width.toFixed(6)+'\t'+height.toFixed(6));
      }
   }
*/
   return boxes;
}

function splitArea(mm)
{
   var boxes = [];

   var AS = 1 / 3600;

   var minDec = mm.minDec - AS;
   var maxDec = mm.maxDec + AS;
   var minRa  = mm.minRa - AS;
   var maxRa  = mm.maxRa + AS;

   if (minDec < -90) minDec = -90;
   if (maxDec >  90) maxDec = 90;

   minDec = Math.roundTo(minDec, 12);
   maxDec = Math.roundTo(maxDec, 12);
   minRa  = Math.roundTo(minRa, 12);
   maxRa  = Math.roundTo(maxRa, 12);

   var deltaD = (maxDec - minDec);

   if (deltaD > 1)
   {
      deltaD /= Math.ceil(deltaD);
   }

   deltaD = Math.roundTo(deltaD, 12);

   var deltaR = arcDiff(maxRa, minRa);

   // Console.writeln('deltaD '+deltaD);

   if (deltaR > 1)
   {
      deltaR /= Math.ceil(deltaR);
   }

   deltaR = Math.roundTo(deltaR, 12);
   // Console.writeln('deltaR '+deltaR);

   var dec    = minDec;

   while (dec < (maxDec - AS))
   {
      var de1     = dec + deltaD;
      var height  = de1 - dec;
      if (height < AS) break;
      var ra1 = minRa;
      while (ra1 < (maxRa - AS))
      {
         var ra2 = ra1 + deltaR;
         var width = arcDiff(ra2, ra1);
         if (width < AS) break;
         var box = {ra:reduce(ra1 + width / 2),      // box center
                     dec:(dec + height / 2),          // ...
                     width:width,
                     height:height,
                     area:(width * height)};
         boxes.push(box);

         // Console.writeln(box.ra+'\t'+box.dec+'\t'+box.width+'\t'+box.height);
         ra1 = ra2;
      }
      dec = de1;
   }

   return boxes;
}

function miniMax(c00, c01, c10, c11)
{
   var minDec = Math.min(c00.y, c01.y, c10.y, c11.y);
   var maxDec = Math.max(c00.y, c01.y, c10.y, c11.y);
   var minRa  = Math.min(c00.x, c01.x, c10.x, c11.x);
   var maxRa  = Math.max(c00.x, c01.x, c10.x, c11.x);
/*
   Console.writeln('minDec:\t'+minDec, '\tmaxDec:\t'+maxDec +
                  '\nminRa:\t'+minRa +  '\tmaxRa:\t'+maxRa);
   Console.writeln();
   Console.writeln('minDec:\t' + DMSangle.FromAngle(minDec).ToString(true),
                  '\tmaxDec:\t'+ DMSangle.FromAngle(maxDec).ToString(true) +
                  '\nminRa:\t' + DMSangle.FromAngle(reduce(minRa )/ 15).ToString(true) +
                  '\tmaxRa:\t' + DMSangle.FromAngle(reduce(maxRa )/ 15).ToString(true));
   Console.writeln();
*/
   if (maxRa - minRa > 180)
   {
      var r  = minRa;
      minRa  = maxRa - 360;
      maxRa  = r;
   }
/*
   Console.writeln('minDec:\t'+minDec, '\tmaxDec:\t'+maxDec +
                  '\nminRa:\t'+minRa +  '\tmaxRa:\t'+maxRa);
   Console.writeln();
   Console.writeln('minDec:\t' + DMSangle.FromAngle(minDec).ToString(true),
                  '\tmaxDec:\t'+ DMSangle.FromAngle(maxDec).ToString(true) +
                  '\nminRa:\t' + DMSangle.FromAngle(reduce(minRa )/ 15).ToString(true) +
                  '\tmaxRa:\t' + DMSangle.FromAngle(reduce(maxRa )/ 15).ToString(true));
   Console.writeln();
*/
   return {minDec:minDec, maxDec:maxDec, minRa:minRa, maxRa:maxRa};

}

function arcDiff(a, b)
{
   var z = a - b;
   if (z >= 180 && z < 180)
      return z;
   else
      z = z - Math.floor((z + 180) / 360) * 360;
   while (z >= 360) {z -= 360};
   return z;
}

function reduce(angle)
{
   while (angle >= 360) {angle -= 360;}
   while (angle <    0) {angle += 360;}
   return angle;
}

function rot(p, center, angle)
{
   angle *= Math.RAD;
   var x = Math.cos(angle) * (p.x - center.x) -
           Math.sin(angle) * (p.y - center.y) + center.x;

   var y = Math.sin(angle) * (p.x - center.x) +
           Math.cos(angle) * (p.y - center.y) + center.y;
   return new Point(x,y);
}


function pixVertices(e, cx, cy)
{
   var vertices = [[cx    , cy  ],
                   [cx + 1, cy  ],
                   [cx    , cy + 1],
                   [cx + 1, cy + 1]
                  ];
   var count = 0;
   for (var i in vertices)
   {
      var v = vertices[i];
      if (e.inside(v[0], v[1])) count += 1;
   }
   return count;
}

function ellipsoid(cx_, cy_, a_, b_, theta_, image_)
{

   var r = Math.round(Math.max(a_, b_) + 0.5);
   var rect = new Rect (Math.floor(cx_) - r, Math.floor(cy_) - r,
                        Math.floor(cx_) + r, Math.floor(cy_ + r));

   var ir = new Rect(image_.width, image_.height);

   if (!ir.intersects(rect))
      this.rect = null;
   else
      this.rect = ir.intersection(rect);


   //Console.writeln('rect  '+'\t'+cx_+'\t'+cy_+'\t'+r+'\t'+ rect);
   //Console.writeln('intersection  '+'\t'+this.rect);


   var a  = a_;
   var b  = b_;
   var cx = cx_;
   var cy = cy_;
   var theta = theta_ * Math.RAD;

   var cos = Math.cos(theta);
   var sin = Math.sin(theta);


   this.inside = function ( px, py )
   {
      px -= cx;
      py -= cy;

      var rc = rotate (px, py);

      if( Math.pow((rc.px) / a, 2) + Math.pow((rc.py) / b, 2) < 1) {
         return true;
      }
      return false;
   }

   function rotate( px, py ) {
      if ( theta != 0 )
      {
         var px_translate = px;
         var py_translate = py;
         px = px_translate * cos - py_translate * sin;
         py = px_translate * sin + py_translate * cos;
      }

      return { px: px, py: py };
   }
}


function getKeyValue(window, keyName)
{
   //
   // search key keyName
   //
   for (var i in window.keywords)
   {
      with (window.keywords[i])
      {
         if (name == keyName)
         {
            return value.toNumber();
         }
      }
   }
   return null;
}

function getKeyString(window, keyName)
{
   //
   // search key keyName
   //
   for (var i in window.keywords)
   {
      with (window.keywords[i])
      {
         if (name == keyName)
         {
            var s = strippedValue;
            return s;
         }
      }
   }
   return null;
}

function getKeyComment(window, keyName)
{
   //
   // search key keyName
   //
   var kwords = window.keywords.filter(k => {
      return k.name == keyName;
      });

   return kwords.length == 0 ? null : kwords[0].comment;
}


function getProjection(comment)
{
   var a = comment.split(':');
   if (a.length == 2) return a[1].trim();
   return "";
}

// *************************** begin catalog section ***************************
//
//
// Bright Star Catalog
//
//
// *****************************************************************************
function writeBSC5(ra, dec, radius, filename)
{
   // create VizieR-like file with stars from BSC5
   //
   // ra, dec and radius in degrees
   // output text to filename
   //
   // purpose: compensate missing bright stars in Gaia
   // add bsc5
   // check, if already found
   /*
   format

   # BSC5 VizieR minimal format, circular search
   #INFO queryParameters=8
   #-oc.form=D.
   #-source=BSC5
   #-c.ra=229.969808
   #-c.dec=2.330356
   #-c.rd= radius in degrees
   #-out.max=unlimited
   #-out=ra,dec,Gmag,pmRA,pmDE
   #Gmag=5.06..16.06
   --------------- --------------- ------- --------- ---------
                                   Gma     pmRA      pmDE
   RA_ICRS (deg)   DE_ICRS (deg)   g (mag) (mas/yr)  (mas/yr)
   --------------- --------------- ------- --------- ---------
   230.29508629029 +02.08617344222 14.9809   -21.072    -2.828
   123456789012345 123456789012345 1234567 123456789 123456789
   */
   //
   // find bsc and select inside radius
   //
   var docDirectory = getScriptDocDirectory('MaskGen');
   if (docDirectory == '')
   {
      Console.writeln('No document directory found for this script');
      return;        // no script document directory /MaskGen
   }
   var bsc5dat = docDirectory + '/MaskGen.bsc';

   Console.writeln('BSC5 data from '+ bsc5dat);

   var stars = [];

   if (File.exists(bsc5dat))
   {
      var allstars = readCompressedShortBSC(bsc5dat);
      for (var i in allstars)
      {
         var dist = angularSeparation(ra, dec, allstars[i].ra, allstars[i].dec);
         if (dist > radius) continue;
         stars.push(allstars[i]);
      }
   }

   var buffer = [];

   buffer.push('# BSC5 VizieR minimal format, circular search');
   buffer.push('#INFO queryParameters=8');
   buffer.push('#-oc.form=D.');
   buffer.push('#-source=BSC5');
   buffer.push('#-c.ra=' + ra.toString());
   buffer.push('#-c.dec=' + dec.toString());
   buffer.push('#-c.rd=' + radius.toString());
   buffer.push('#-out.max=unlimited');
   buffer.push('#-out=ra,dec,Gmag,pmRA,pmDE');
   buffer.push('#Gmag=0..16');
   buffer.push('--------------- --------------- ------- --------- ---------');
   buffer.push('                                Gma     pmRA      pmDE');
   buffer.push('RA_ICRS (deg)   DE_ICRS (deg)   g (mag) (mas/yr)  (mas/yr)');
   buffer.push('--------------- --------------- ------- --------- ---------');

   for (var i in stars)
   {
      var star = stars[i];
      with (star)
      {
         var sstr = pl(ra.toFixed(11), 15) + ' ' + pl(dec.toFixed(11), 15) + ' ' +
                    pl(Gmag.toFixed(4), 7) + ' ' +
                    pl(pmRA.toFixed(3), 9) + ' '  + pl(pmDE.toFixed(3), 9);
      }
      buffer.push(sstr);
   }

   Console.writeln('Circular search for bright stars.\nRadius: ' + radius.toFixed(4) +
                   ' degrees, count: ' + stars.length);

   buffer.push('\n');
   //
   File.writeTextFile(filename, buffer.join('\n'));

   function pl(str, len)
   {
      if (str.length >= len) return str;
      var spaces = '';
      while (spaces.length < len-str.length) spaces += ' ';
      return spaces + str;
   }
}

function readCompressedShortBSC(filename)
{
   //
   // read and return star objects
   //
   var comprFile = new File();
   comprFile.openForReading(filename);
   //
   // read subblocks into subs
   //
   var subs = [];
   //
   while (comprFile.position < comprFile.size)
   {
      // read  checksum1, checksum2, uncompressedSize, compressedLen, compressedData
      var checksum1        = comprFile.read(DataType_UInt64);
      var checksum2        = comprFile.read(DataType_UInt64);
      var uncompressedSize = comprFile.read(DataType_UInt64);
      var compressedLen    = comprFile.read(DataType_UInt64);
      var compressedData   = comprFile.read(DataType_ByteArray, compressedLen);
      var sub = [compressedData, uncompressedSize, checksum1, checksum2];
      subs.push(sub);
   }
   //
   // close after read subs
   //
   comprFile.close();
   //
   // create Compression
   //
   var compr = new Compression(Compression_ZLib);
   //
   // decompress subs
   //
   var uncompBytes = compr.uncompress(subs);
   //
   // ByteArray to String
   //
   var starData = uncompBytes.toString();
   //
   // split text into lines of 24 bytes each
   //
   var index = 0;
   var stars = [];
   var l     = 32;      // length of each record
   while (index < starData.length)
   {
      var a = starData.substr(index, l);
      index += a.length;
      //if (index < 240) Console.writeln(a);
      if (a.length == 0) continue;
      if (a.substr(0 , 2) == "  ") continue;
      var ra  = a.substr(0 , 2).toNumber() +
                a.substr(2 , 2).toNumber() / 60 +
                a.substr(4 , 4).toNumber() / 3600;

      var dec  = a.substr(9 , 2).toNumber() +
                 a.substr(11 , 2).toNumber() / 60 +
                 a.substr(13 , 2).toNumber() / 3600;
      if (a[8] == '-') dec  = -dec;

      var vmag = 99;

      if (a.substr(15 , 3) != "   ") vmag = a.substr(15 , 5).toNumber();
      var pmRA = 0;
      if (a.substr(20 , 3) != "   ") pmRA = a.substr(20 , 6).toNumber();
      var pmDE = 0;
      if (a.substr(26 , 3) != "   ") pmDE = a.substr(26 , 6).toNumber();
      // use BSC Vmag as Gmag
      stars.push({ra:ra*15, dec:dec, 'Gmag':vmag, pmRA:pmRA * 1000, pmDE:pmDE * 1000});
   }
   return stars;
}

function getScriptDocDirectory(scriptName)
{
   var i = File.currentWorkingDirectory.indexOf('PixInsight')

   if (i > -1)
   {
      var docDirectory = File.currentWorkingDirectory.substr(0, i + 10) +
                         '/doc/scripts/' + scriptName;;

      var dirInfo = new FileInfo(docDirectory);

      if (dirInfo.isDirectory) return docDirectory;
   }
   return '';
}
// *****************************************************************************
//
//                                MaskGenData
//
// *****************************************************************************
function MaskGenData(dataFolder, id, ra, dec)
{
   var folder = dataFolder;

   this.baseFile = ra.toFixed(6);
   if (dec < 0)
      this.baseFile += dec.toFixed(6);
   else
      this.baseFile += '+' + dec.toFixed(6);

   var jsonFile = folder + '/' + this.baseFile + '.json';

   var data = null;

   if (File.exists(jsonFile))
   {
      var strJSON = File.readTextFile(jsonFile);
      data = JSON.parse(strJSON);
      //
      // verify files
      //
      for (var i = 0; i < data.filedescriptors.length; i++)
      {
         var fd = data.filedescriptors[i];
         if (fd.valid)
         {
            if (File.exists(fd.binfile))
            {
               var MD5 = (new CryptographicHash(CryptographicHash_MD5 )).hash(
                     File.readFile( fd.binfile ) ).toHex();
               fd.valid = MD5 = fd.MD5;
            }
            else
               fd.valid = false;
         }
      }
   }
   else
      data = new maskGenData(id, ra, dec);

   //
   // application open, read , close
   //

   var selectedTableIndex  = -1;
   var selectedTable       = null;


   this.getDataInfo = function() {return data;}

   this.getJSONFile = function() {return jsonFile;}

   this.getnextIndex = function()
   {
      return data.filedescriptors.length;
   }

   this.open = function()
   {
      selectedTableIndex = -1;

      if (!selectNextTable()) return false;

      selectedTable.open();

      return true;
   }

   this.read = function ()
   {
      if (selectedTable == null) throw 'Object not open [call open()]';

      var star = selectedTable.read();

      if (star != null) return star;

      selectedTable.close();

      if (!selectNextTable()) return null;      // eod

      selectedTable.open();

      return this.read();   // re-do with next table
   }

   this.close = function ()
   {
      if (selectedTable != null && selectedTable.valid)
      {
         selectedTable.close();
      }
   }

   function selectNextTable()
   {
      selectedTableIndex += 1;

      if (selectedTableIndex < data.filedescriptors.length)
      {
         selectedTable = new VizieRBinTable(data.filedescriptors[selectedTableIndex]);

         return selectedTable.valid; // true;
      }
      else
      {
         selectedTable = null;
         return false;
      }
   }

   this.addNewDescriptor = function(filedescriptor)
   {
      data.filedescriptors.push(filedescriptor);
      var jsonStr = JSON.stringify(data);
      File.writeTextFile(jsonFile, jsonStr);
   }

   this.fillDescriptor = function(index, textfile)
   {
      // convert textfile to binfile and store filedescription
      //
      var filedescriptor = VizieRToBin(textfile, data.filedescriptors[index].binfile);
      if (filedescriptor == null) return false;

      // replace properties

      var keys = Object.keys(filedescriptor);
      for (var i = 0; i < keys.length; i++)
      {
         data.filedescriptors[index][keys[i]] = filedescriptor[keys[i]];
      }

      adjustProperties(data);

      var jsonStr = JSON.stringify(data);
      File.writeTextFile(jsonFile, jsonStr);

      return true;
   }

   this.filesCompleted = function()
   {
      // check all filedescriptors valid
      for (var i = 0; i < data.filedescriptors.length; i++)
      {
         if (!data.filedescriptors[i].valid) return false;
      }
      return true;
   }

   function maskGenData(id, ra, dec)
   {
      //
      // common parms
      //
      this.id      = id;
      this.ra      = ra;
      this.dec     = dec;
      this.radius  = 0;
      this.minMag  = Number.MAX_VALUE;
      this.maxMag  = Number.MIN_VALUE;
      this.radius  = 0;
      this.box     = [0, 0];
      this.records = 0
      this.valid   = true;
      //
      // parms per file
      //
      this.filedescriptors = [];
   }

   function adjustProperties (d)
   {
      if (d.filedescriptors.length == 0) return;
      var count = 0;
      var valiD = true;
      for (var i in d.filedescriptors)
      {
         var fd         = d.filedescriptors[i];
         if (fd.records == 0) continue;
         with (d)
         {
            minMag     = Math.min(minMag, fd.minMag);
            maxMag     = Math.max(maxMag, fd.maxMag);
            radius     = Math.max(radius, fd.radius);
            count     += fd.records;
            valiD      = valiD && fd.valid;
         }
      }
      d.records = count;
      d.valid   = valiD;
      //
      // expand box size
      //
      d.box  = expandToBox(d.filedescriptors);

      function expandToBox(descriptors)
      {
         // each fileDescriptor box has ra, dec, radius and size (x, y) in degrees
         //
         //writeObject(descriptors[0]);
         var box = null;
         var r   = null;
         // get first box (radius = 0)
         for (var i = 0; i < descriptors.length; i++)
         {
            if (descriptors[i].records == 0) continue;
            if (descriptors[i].radius  == 0) continue;
            box = descriptors[i].box;
            var x0  = descriptors[i].ra -  box[0] / 2;   // add degree
            var x1  = descriptors[i].ra +  box[0] / 2;   // add degree
            if (x1 - x0 < 0) x0 -= 360;
            var y0  = descriptors[i].dec - box[1] / 2;   // add degree
            var y1  = descriptors[i].dec + box[1] / 2;   // add degree
            r = new Rect(x0, y0, x1, y1);
            break;
         }

         if (box == null) return [0, 0];

         for (var i = 1; i < descriptors.length - 1; i++)
         {
            //writeObject(descriptors[i]);
            x0  = descriptors[i].ra -  descriptors[i].box[0] / 2;   // add degree
            x1  = descriptors[i].ra +  descriptors[i].box[0] / 2;   // add degree
            if (x1 - x0 < 0) x0 -= 360;
            y0  = descriptors[i].dec - descriptors[i].box[1] / 2;   // add degree
            y1  = descriptors[i].dec + descriptors[i].box[1] / 2;   // add degree

            var q = new Rect(x0, y0, x1, y1);

            r = r.union(q);
         }
         return [r.width, r.height];
      }
   }
}
// *****************************************************************************
//
// VizieRBinaryTable reader
//
//    reads object star
//       star properties: ra, dec, Gmag, pmRA, pmDE
//
//    usage
//          var rdr = new VizieRBinTable(filedescriptor);
//
//          rdr.open();
//          if (rdr.valid)
//          {
//             var star = rdr.read();
//             if (star == null) break;
//             // process...
//          }
//          rdr.close();
//
function VizieRBinTable(filedescriptor)
{
   // read binary table with ra, dec, Gmag, pmRA, pmDE
   //
   this.MD5 = (new CryptographicHash(CryptographicHash_MD5 )).hash(
               File.readFile( filedescriptor.binfile ) ).toHex();
   this.valid = this.MD5 == filedescriptor.MD5;

   if (!this.valid) return;

   var infile = null;


   this.open = function()
   {
      infile =  new File();
      infile.openForReading(filedescriptor.binfile);
   }

   this.read = function()
   {
      if (infile.position >= infile.size) return null;

      var float64Array = infile.read( DataType_Float64Array, 2);

      var float32Array = infile.read( DataType_Float32Array, 3);

      return {ra:float64Array[0], dec:float64Array[1], Gmag:float32Array[0],
              pmRA:float32Array[1], pmDE:float32Array[2]};
   }

   this.close = function()
   {
      infile.close();
      infile = null;
   }
}

//
// fileDescriptor object
//

function fileDescriptor(binfile, valid, MD5, minMag, maxMag, source,
                        ra, dec, radius, box, records)
{
   // parameters to object
   return {binfile:binfile, valid:valid,
           MD5:MD5, minMag:minMag, maxMag:maxMag,
           source:source, ra:ra, dec:dec,
           radius:radius, box:box, records:records};
}

// *****************************************************************************
//
// VizieRBinaryTable
//    fixed length records of 28 bytes each:
//       double   ra
//       double   dec
//       float    Gmag
//       float    pmRA
//       float    pmDE
//
// Return
//       fileDescriptor object
//       .ra
//       .dec
//       .binfile
//       .MD5        binfile checksum
//       .minMag
//       .maxMag
//       .radius     degrees
//       .box
//       .records
//
// *****************************************************************************

function VizieRToBin(filename, binfile)
{
   // VOTable to binary file

   if (File.exists(binfile)) File.remove(binfile);

   var outFile = new File();
   outFile.createForWriting(binfile);

   var tbl = new VizieRTextTable(filename);

   if (!tbl.valid) return null;

   var parms = tbl.getParms();                           // VOTable parms

   var minMag = Number.MAX_VALUE;
   var maxMag = Number.MIN_VALUE;
   var records = 0;

   while (!tbl.eof)
   {
      var obj = tbl.read();

      if (obj == null) break;

      if (!obj.valid) continue;                          // data missing

      var binData = [];

      // values

      binData.push(obj.ra);

      binData.push(obj.dec);

      var doubleNumbers = new Float64Array( binData );   // ra, dec

      binData = [];

      binData.push(obj.Gmag);

      binData.push(obj.pmRA);

      binData.push(obj.pmDE);

      var floatNumbers  = Float32Array( binData );        // Gmag, pmRA, pmDE

      outFile.write(doubleNumbers);

      outFile.write(floatNumbers);

      if (obj.Gmag < minMag) minMag = obj.Gmag;
      if (obj.Gmag > maxMag) maxMag = obj.Gmag;

      records += 1;
   }

   tbl.close();

   outFile.close();
   Console.writeln('VizieRToBin box '+parms.box[0]+', '+parms.box[1]);
   var MD5 = (new CryptographicHash(CryptographicHash_MD5 )).hash(
               File.readFile( binfile ) ).toHex();

   return fileDescriptor(binfile, true, MD5, minMag, maxMag, parms.source,
                         parms.ra, parms.dec, parms.radius, parms.box, records);
}

// *****************************************************************************
//
// VizieRTextTable, votable plain text format reader
//
// *****************************************************************************

function VizieRTextTable(filename)
{
   /*
      Usage:
         var tbl = new TextTable(filename, ['name1', 'name2',..]);

         // test

         if (tbl.isOpen) { do work }

         var prm = tbl.getParms();

         var obj = tbl.read();

         if (obj != null) { do work }

         tbl.close();

   */
   this.columns   = [];
   this.eot       = false;
   this.valid     = false;

   var parms      = new Object();         // register all #. parameters
   parms.radius   = 0;
   parms.box      = [0, 0];

   var tables     = [];                   // collection of Name, columns[], position

   this.lineIndex = -1;
   var line = "";
   var fields = [];

   var rdr = new reader(filename);
   this.isOpen = rdr.open();
   if (!this.isOpen)
   {
      Console.writeln('Open error:' + '\t' + filename);
      return;
   }

   //Console.writeln('File open: ' + filename);

   this.close = function()
   {
      rdr.close();
   }

   this.getParms = function()
   {
      return parms;
   }

   this.read = function()
   {
      if (rdr.eof())
      {
         this.eot = true;
         return null;
      }

      var dataLine = rdr.readLn();

      // Console.writeln(dataLine);

      if (dataLine.length == 0) return null;
      this.lineIndex += 1;
      //
      // collect fields
      //
      var data = new Object();
      data['valid'] = true;
      for (var i in fields)
      {
         var f = fields[i];
         var n = dataLine.substr(f.x, f.y).trim();
         if (n == '')
         {
            data[this.columns[i]] = 0;       // null; ignore missing pm
            //data['valid'] = false;
         }
         else
         {
            var v = n.tryToNumber();
            data[this.columns[i]] = v;
         }
      }
      return data;
   }

   // collect QUERY parameters

   while (!rdr.eof())
   {
      line     = rdr.readLn();
      if (line.contains('queryParameters'))
      {
         var a = line.split('=');
         var n = a[1].toInt();
         Console.writeln('parameters ' + n);
         for (var i = 0; i < n; i++)
         {
            line     = rdr.readLn();
            var a    = line.split('=');
            var key  = a[0];
            if (key.startsWith('#-'))
            {
               if (key == '#-oc.form')  parms['form']     = a[1];
               if (key == '#-source')   parms['source']   = a[1];
               if (key == '#-c.ra')     parms['ra']       = a[1].tryToNumber();
               if (key == '#-c.dec')    parms['dec']      = a[1].tryToNumber();

               if (key == '#-c.rd')     parms.radius      = a[1].tryToNumber();
               if (key == '#-c.rm')     parms.radius      = a[1].tryToNumber() / 60;
               if (key == '#-c.rs')     parms.radius      = a[1].tryToNumber() / 3600;

               if (key == '#-c.bd')
               {
                  var size = a[1].split('x');
                  parms.box = [size[0].tryToNumber(), size[1].tryToNumber()];
               }
               if (key == '#-c.bm')
               {
                  var size = a[1].split('x');
                  parms.box = [size[0].tryToNumber()  / 60, size[1].tryToNumber()  / 60];
               }
               if (key == '#-c.bs')
               {
                  var size = a[1].split('x');
                  parms.box = [size[0].tryToNumber()  / 3600, size[1].tryToNumber()  / 3600];
               }

               if (key == '#-out.max')  parms['max']      = a[1];
               if (key == '#-out')      this.columns      = a[1].split(',');
            }
         }
         break;
      }
   }

   while (!rdr.eof() && !line.startsWith('-'))
   {
      line     = rdr.readLn();
      if (line.startsWith('# ')) continue;
      if (line.startsWith('#-')) continue;
      else if (line.startsWith('#INFO')) continue;
      else if (line.startsWith('#'))
      {
         a    = line.split(':');
         var name = a[0].substr(1);
         if (a.length > 1) parms[name] = a[1].trim();
      }

      if (line.startsWith('-'))
      {
         var secondLine = "";
         while (!rdr.eof())
         {
            secondLine = rdr.readLn();
            if (line == secondLine)
            {
               this.lineIndex = 0;
               var cols = line.split(' ');
               var j = 0;
               for (var i in cols)
               {
                  var f = new Point(j, cols[i].length);
                  fields.push(f);
                  j += f.y + 1;
               }
               this.valid = true;
               return;     // reader now at position on 1st data line
            }
         }
      }
   }

   Console.writeln("Bad table, reader closed");
   rdr.close();
   this.open = false;
}
// *****************************************************************************
//                               END VizieRTextTable
// *****************************************************************************

// *****************************************************************************
//
// text reader
//
// *****************************************************************************

function reader(filename)
{
   const maxBlock = 65536;
   this.filename  = filename;
   this.errormsg  = "";
   this.length    = 0;
   var file       = null;
   var buffer     = null;
   var position   = 0;
   var blockSize  = 0;
   var line       = '';
   var eof        = false;
   var isOpen     = false;

   this.error = function()
   {
      return this.errormsg.length > 0;
   }

   this.eof       = function()
   {
      if (!isOpen) throw ("The file is is not open");
      return eof;
   }

   this.isOpen    = function()
   {
      return isOpen;
   }

   this.open = function()
   {
      if (!File.exists)
      {
         this.errormsg = "File not found: " +this.filename;
      }
      file = new File();
      try
      {
         file.openForReading(this.filename);
      }
      catch (ex)
      {
         this.errormsg = "File open error: " + '\n' + this.filename;
      }
      if (this.error()) return false;
      this.length = file.size;
      blockSize   = maxBlock;
      readBuffer();
      line        = '';
      eof         = false;
      isOpen      = !eof;
      return true;
   }

   this.readLn = function()
   {
      if (eof) throw ("The file is closed");
      if (!isOpen) throw ("The file is is not open");

      while (true)
      {
         if (position == blockSize)
         {
            readBuffer();
            if (buffer == null)
            {
               eof = true;
               return line;      // return unterminated string
            }
         }
         var i = buffer.linearSearch(10, position);
         if (i > -1)
         {
            line += buffer.toString(position, i - position);
            line = line.replace('\r', '');
            position = i + 1;
            var Line = line;
            line = '';
            return Line;
         }
         else
         {
            line += buffer.toString(position, blockSize - position);
            position = blockSize;
         }
      }
   }

   this.close = function()
   {
      if (file != null)
      {
         file.close();
         file = null;
      }
      buffer = null;
   }

   this.rewind = function()
   {
      if (!isOpen) throw ("The file is is not open");
      eof = false;
      file.position = 0;
      blockSize   = maxBlock;
      readBuffer();
   }

   function readBuffer()
   {
      blockSize = Math.min(blockSize, file.size - file.position);
      var intBuffer = null;
      if (blockSize > 0)
         intBuffer =file.read( DataType_Int8Array, blockSize);
      else
      {
         buffer = null;
         return;
      }
      buffer   = new ByteArray(intBuffer);
      position = 0;
   }
}

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

//

function loadLocalDR3(cc, parms)
{
   var baseFile = cc.ra.toFixed(6);
   if (cc.dec < 0)
      baseFile += cc.dec.toFixed(6);
   else
      baseFile += '+' + cc.dec.toFixed(6);

   cc.GaiaDR3File = parms.dataFolder + '/' + baseFile + '.dr3';

   if (File.exists(cc.GaiaDR3File)) return;

   var P = new Gaia;
   P.command = "search";
   P.centerRA = cc.ra;
   P.centerDec = cc.dec;
   P.radius = cc.radius;
   P.magnitudeLow = -1.500;
   P.magnitudeHigh = 26.000;
   P.sourceLimit = 4294967295;
   P.requiredFlags = 0;
   P.inclusionFlags = 0;
   P.exclusionFlags = 0;
   P.verbosity = 2;
   P.dataRelease = Gaia.prototype.DataRelease_E3;
   P.sortBy = Gaia.prototype.SortBy_G;
   P.generateTextOutput = true;
   P.textFormat = Gaia.prototype.TextFormat_TabularCompound;
   P.textHeaders = Gaia.prototype.TextHeaders_SearchParametersAndTableColumns;
   P.outputFilePath = cc.GaiaDR3File;

   P.executeGlobal();
}

function XGaiaDR3File(FilePath)
{
   Console.writeln('FilePath ' + FilePath);
   var rdr = new reader(FilePath);

   rdr.open();

   this.open = function()
   {
   }

   function getLineFormat (line)
   {
      var lineFormat = [];
      var v = 0;
      var i = 0;
      while (true)
      {
         var j = line.indexOf(' =', i);
         if (j == -1)
         {
            lineFormat.push([i , line.length - 1]);
            break;
         }
         lineFormat.push([i , j]);
         i = j + 1;
      }
      return lineFormat;
   }
   //
   // read header
   //
   var strSources = "";
   var strRa = "";
   var strDec = "";
   var strRadius = "";
   var strMinMag = "";
   var strMaxMag = "";

   var lineFormat;

   while (!rdr.eof())
   {
      var line = rdr.readLn();
      if (line.length == 0) continue;

      if (line.startsWith('=='))
      {
         while (!rdr.eof())
         {
            line = rdr.readLn();
            if (line.length == 0) continue;

            if (line.startsWith('=='))
            {
               lineFormat = getLineFormat(line);
               break;   // header/data separator
            }
            //
            // format o.e.: Center Right Ascension ...   5 34 31.9400 (hms)
            // pos          01234567890123456789012345678901234567890123456789
            //              0         1         2         3         4
            //
            var parms = GaiaCatParms(line);
            var key = parms.key;
            var value = parms.value;
            if (key =='Total sources') strSources = value;
            if (key =='Center Right Ascension') strRa = value;
            if (key =='Center Declination') strDec = value;
            if (key =='Search radius') strRadius = value;
            if (key =='Magnitude low limit') strMinMag = value;
            if (key =='Magnitude high limit') strMaxMag = value;
         }
         break;
      }
   }

   this.sources = strSources.toInt();
   this.ra  = DMSangle.FromString(strRa.trim(), 0, 24).GetValue() * 15;
   this.dec = DMSangle.FromString(strDec.trim(), 0, 90).GetValue();
   this.radius = DMSangle.FromString(strRadius.trim(), 0, 90).GetValue();
   this.minMag = strMinMag.toFloat();
   this.maxMag = strMaxMag;

   this.read = function()
   {
      if (rdr.eof()) return null;
      var line = rdr.readLn();
      if (line.length == 0) return null;
      //
      var subStrings = [];
      for (var i = 0; i < lineFormat.length; i++)
      {
         var format = lineFormat[i];
         subStrings.push(line.substring(format[0], format[1]));
      }

      var ra  = DMSangle.FromString(subStrings[0].trim(), 0, 24).GetValue() * 15;
      var dec = DMSangle.FromString(subStrings[1].trim(), 0, 90).GetValue();
      var pmRa = 0.0;
      if (subStrings[3].trim() != "") pmRa = subStrings[3].toFloat();
      var pmDec = 0.0;
      if (subStrings[4].trim() != "") pmDec = subStrings[4].toFloat();
      var gmag = subStrings[5].toFloat();
      var G_BP = "";
      var G_RP = "";
      if (subStrings[6].trim() != "") G_BP = subStrings[6].toFloat();
      if (subStrings[7].trim() != "") G_RP = subStrings[7].toFloat();
      return {ra:ra, dec:dec, pmRA:pmRa, pmDE:pmDec, Gmag:gmag, G_BP:G_BP, G_RP:G_RP};
   }

   this.close = function ()
   {
      rdr.close();
   }

   this.filesCompleted = function ()
   {
      return this.sources > 0;
   }

   this.getDataInfo = function()
   {
      return {minMag:this.minMag, maxMag:this.maxMag,filedescriptors:[null], records:this.sources};
   }
}

function GaiaCatParms(line)
{
   if (!line.contains('..')) return {key:'', value:''};
   //
   // first ...
   //
   var i = line.indexOf('..');

   var key = line.substr(0, i).trim();
   // start value
   i = line.indexOf(' ', i);
   var value = '';
   for (var j = i + 1; j < line.length; j++)
   {
      if (line[j] == '(') break;
      value += line[j];
   }
   return {key:key, value:value};
}

// ***************************' end catalog section ****************************
//



function  writeObject(o)
{
   var keys = Object.keys(o);

   for (var i in keys) Console.writeln(i + '\t' + keys[i] + '\t' + o[keys[i]]);
}
