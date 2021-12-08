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

#include <pjsr/StdButton.jsh>
#include <pjsr/FrameStyle.jsh>
#include <pjsr/TextAlign.jsh>
#include <pjsr/NumericControl.jsh>
#include <pjsr/Sizer.jsh>
#include <pjsr/Slider.jsh>
#include <pjsr/UndoFlag.jsh>
#include <pjsr/SampleType.jsh>
#include <pjsr/DataType.jsh>
#include <pjsr/Color.jsh>
#include <pjsr/FileMode.jsh>
#include <pjsr/StdIcon.jsh>
#include <pjsr/StdCursor.jsh>
#include <pjsr/CryptographicHash.jsh>

#feature-id  Utilities > MaskGen

#define ID                 "MaskGen"
#define TITLE              "Mask Generator"
#define VERSION            "1.4.3-beta"
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
   importGccParms(this);
}

function exportGccParms(parms)
{
   Parameters.set("minMagCat", parms.minMagCat);
   Parameters.set("maxMagCat", parms.maxMagCat);
   Parameters.set("minMagMask", parms.minMagMask);
   Parameters.set("maxMagMask", parms.maxMagMask);
   Parameters.set("minRadius", parms.minRadius);
   Parameters.set("maxRadius", parms.maxRadius);
   Parameters.set("maxWidth", parms.maxWidth);
   Parameters.set("minWidth", parms.minMagCat);
   Parameters.set("allStars", parms.allStars);
   // Parameters.set("VizierSite", parms.VizierSite);
   Parameters.set("version", parms.version);
   Parameters.set("softEdges", parms.softEdges);
   Parameters.set("ringWidthScale", parms.ringWidthScale);
   Parameters.set("ringMask", parms.ringMask);
   Parameters.set("dataFolder", parms.dataFolder);
}

function importGccParms(parms)
{
   if (Parameters.has("minMagCat")) {
      parms.minMagCat = Parameters.getReal("minMagCat");
   }
   if (Parameters.has("maxMagCat")) {
      parms.maxMagCat = Parameters.getReal("maxMagCat");
   }
   if (Parameters.has("minMagMask")) {
      parms.minMagMask = Parameters.getReal("minMagMask");
   }
   if (Parameters.has("maxMagMask")) {
      parms.maxMagMask = Parameters.getReal("maxMagMask");
   }
   if (Parameters.has("minRadius")) {
      parms.minRadius = Parameters.getReal("minRadius");
   }
   if (Parameters.has("maxRadius")) {
      parms.maxRadius = Parameters.getReal("maxRadius");
   }
   if (Parameters.has("maxWidth")) {
      parms.maxWidth = Parameters.getReal("maxWidth");
   }
   if (Parameters.has("minWidth")) {
      parms.minWidth = Parameters.getReal("minWidth");
   }
   if (Parameters.has("allStars")) {
      parms.allStars = Parameters.getBoolean("allStars");
   }
   if (Parameters.has("version")) {
      parms.version = Parameters.getString("version");
   }
   if (Parameters.has("softEdges")) {
      parms.softEdges = Parameters.getBoolean("softEdges");
   }
   if (Parameters.has("ringWidthScale")) {
      parms.ringWidthScale = Parameters.getReal("ringWidthScale");
   }
   if (Parameters.has("ringMask")) {
      parms.ringMask = Parameters.getBoolean("ringMask");
   }
   if (Parameters.has("dataFolder")) {
      parms.dataFolder = Parameters.getString("dataFolder");
   }
}

function cControl()
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
   this.dialog = null;
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
   this.window = null;
   this.years = 0;
   this.GaiaDR3enabled = false;
   this.GaiaDR3using = false;
   this.GaiaDR3File = '';
}


function infoDialog()
{
   this.__base__ = Dialog;
   this.__base__();

   var dlg = this;

   this.helpLabel = new Label( this );
   with ( this.helpLabel )
   {
      frameStyle = FrameStyle_Box;
      margin = 4;
      wordWrapping = true;
      useRichText = true;

      text = "<p><b>MaskGen " + TITLE + " v" + VERSION + "</b></p>" +
      "<p><b>Purpose</p>" +
      "Generating binary star masks for a plate solved image<p>" +
      "<p><b>Supporters</p>" +
      "<p>With thanks for beta testing to Dr. Franz Gruber, Gerald Wechselber and Herbert Walter from Austria</p>" +
      "<p><b>BSC5</p>" +
      "The Bright Star Catalogue by Ellen Dorrit Hoffleit of Yale University is an option and provides bright stars, not listed in the GAIA catalog." +
      " This catalog is saved as compressed version in PixInsight document script folder <b>C:/Program Files/PixInsight/doc/scripts/MaskGen</b>." +
      "<p><b>GAIA</p>" +
      "<p>This work has made use of data from the European Space Agency (ESA) " +
      "mission Gaia " +
      "(https://www.cosmos.esa.int/gaia), processed by the Gaia Data Processing " +
      "and Analysis Consortium " +
       "(DPAC, https://www.cosmos.esa.int/web/gaia/dpac/consortium). " +
     "Funding for the DPAC has been provided by national institutions, " +
      "in particular the institutions participating in the Gaia Multilateral Agreement.</p>" +
      "<p><b>mailto:hvb356@hotmail.de</p>";
   }

   this.btnOK = new PushButton(this);
   with (this.btnOK)
   {
      icon = this.scaledResource(":/icons/ok.png");
      text = "OK";
      onPress = function() parent.done(0);
   }

   var buttonsSizer = new HorizontalSizer();
   buttonsSizer.margin = 4;
   buttonsSizer.addStretch();
   buttonsSizer.add(this.btnOK);

   this.sizer = new VerticalSizer(this);
   this.sizer.add (this.helpLabel);
   this.sizer.addSpacing(12);
   this.sizer.add(buttonsSizer);

   this.setScaledMinSize(500, 250);

   this.windowTitle = "MaskGen - Info";

	this.adjustToContents();
 	this.userResizable = true;
   processEvents();
   this.bringToFront();
}

// **************************************************************************
// **************************************************************************
// **************************************************************************
//
//
//                         MaskGen dialog
//
//
// **************************************************************************
// **************************************************************************
// **************************************************************************
function showDialog(imageWindow)
{
   this.__base__ = Dialog;
   this.__base__();
   var dlg = this;

   var view   = imageWindow.mainView;
   imageWindow.regenerateAstrometricSolution();
   Console.writeln("Create a mask from " + '\t' + view.id);
   Console.writeln("Size" + '\t' + view.image.width+ '\t' + view.image.height);

   var parms = new gccParms();

   if (Parameters.isGlobalTarget) {
      var setts = Settings.read(ID + "/parms", DataType_String );
      if (setts != null)
      {
         parms = JSON.parse(setts);
         parms.versionCheck = function()
         {
            var keys = Object.keys(parms);
            var i = keys.indexOf("version");
            if (i < 0)
            {
               parms = new gccParms();
            }
            else
            {
               var a = parms.version.split('.');
               var b = VERSION.split('.');
               for (var i in a)
               {
                  if (a[i].toInt() < b[i].toInt()) return false;
               }
            }
            return true;
         }
         if (!parms.versionCheck())
         {
            parms = new gccParms();
            parms.version = VERSION;
         }
      }
   }

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


   var cc = new cControl();
   with (cc)
   {
      dialog      = this;
      window      = imageWindow;
      image       = window.mainView.image;
      width       = image.width;
      height      = image.height;
      var pos     = getImageEQPosition(imageWindow);
      id          = getKeyString(window, 'OBJECT');
      if (id == null) id = 'unknown';
      ra          = pos.x;
      dec         = pos.y;
      resolution  = getImageResolution(window);

      GaiaDR3enabled = TypeDescription.externalObjects.indexOf("Gaia") > -1;

      Console.writeln('GaiaDR3enabled '+ GaiaDR3enabled);

      GaiaDR3using = GaiaDR3enabled;

      radius      = Math.sqrt(Math.pow(width / 2, 2) + (Math.pow(height / 2, 2)))
                     * resolution;

      Console.writeln('Dec:\t' + DMSangle.FromAngle(dec).ToString(true),
               '\tRa:\t'+ DMSangle.FromAngle(ra / 15).ToString(true) +
               '\nRadius:\t' + radius.toFixed(4));

      coneArea    = radius * radius * Math.PI / 3600;
      progress    = 0;

      dataVizieR  = new MaskGenData(parms.dataFolder, id, ra, dec);
      //
      // if data is new, begin loading stars from BSC5
      //
      var fdBSC5 = null;
      var index  = -1;
      for (var i in dataVizieR.getDataInfo().filedescriptors)
      {
         if (dataVizieR.getDataInfo().filedescriptors[i].source == 'BSC5')
         {
            fdBSC5 = dataVizieR.getDataInfo().filedescriptors[i];
            index = i;
            break;
         }
      }
      if (fdBSC5 == null && dataVizieR.getDataInfo().filedescriptors.length == 0)
      {
         // try new BSC5 data
         var bsc5 =  File.systemTempDirectory + '/bsc5.txt';
         writeBSC5(ra, dec, radius, bsc5);
         if (File.exists(bsc5))
         {
            var binfile = parms.dataFolder + '/' + cc.dataVizieR.baseFile +
                           '[' + dataVizieR.getnextIndex().toString() + '].bin';

            dataVizieR.addNewDescriptor(fileDescriptor(binfile, false, '', 0, 0, 'BSC5',
                           0, 0, 0, [0, 0], 0))

            dataVizieR.fillDescriptor(0, bsc5)
            File.remove(bsc5);
         }
      }
      if (fdBSC5 != null && !fdBSC5.valid)
      {
         // try refresh BSC5 data
         var bsc5 =  File.systemTempDirectory + '/bsc5.txt';

         writeBSC5(ra, dec, radius, bsc5);
         if (File.exists(bsc5))
         {
            var binfile = parms.dataFolder + '/' + cc.dataVizieR.baseFile +
                           '[' + dataVizieR.getnextIndex().toString() + '].bin';

            dataVizieR.fillDescriptor(index, bsc5);

            Console.writeln('BSC5 updated for this mask');
            File.remove(bsc5);
         }
      }
   }

   cc.boxes = generateBoxes(cc.window);

   for (var i in cc.boxes) cc.boxArea += cc.boxes[i].area;

   // **************************************************************************
   // my © and id label
   //
   this.lblCopyright = new Label(this);
   this.lblCopyright.text      = "© 2019, Hartmut V. Bornemann";
   this.lblCopyright.textAlignment = TextAlign_Left | TextAlign_VertCenter;

   this.iconInfo = new ToolButton(this);
   with (this.iconInfo)
   {
      icon = this.scaledResource(":/icons/info.png");
      onPress = function()
      {
         var dialog = new infoDialog(cc);
	      dialog.execute();
         processEvents();
         dlg.bringToFront();
      }
   }

   var topLineSizer = new HorizontalSizer();
   topLineSizer.margin = 4;
   topLineSizer.add(this.lblCopyright);
   topLineSizer.addStretch();
   topLineSizer.add(this.iconInfo);

   this.lblView = new Label(this);
   this.lblView.text = "<b>View " + view.id + "</b>";
   this.lblView.useRichText = true;

   // **************************************************************************

   var labelWidth1 = this.font.width( "MDate of Observation" + "M" );
   var labelWidth2 = this.font.width( "Mmin:" + "M" );
   var editWidth1  = this.font.width( "MM0000-00-00" );
   var editWidth2  = this.font.width( "99.999M" );

   this.cbGaiaDr2  = new CheckBox(this);
   this.cbGaiaDr2.enabled = cc.GaiaDR3enabled;
   this.cbGaiaDr2.checked = cc.GaiaDR3enabled;
   this.cbGaiaDr2.text = 'GaiaDR3';
   this.cbGaiaDr2.onCheck = function( checked )
   {
       dlg.gbxVizier.enabled= !checked;
       dlg.btnExec.enabled = checked;
       cc.GaiaDR3using = checked;

       if (!cc.GaiaDR3using & cc.dataVizieR.filesCompleted())
       {
          cc.data = cc.dataVizieR;
          dlg.btnExec.enabled = true;
       }
   }

   // date

   this.lblDate   = new Label(this);
   this.lblDate.text = "Date of Observation:";
   this.lblDate.setFixedWidth(labelWidth1);
   this.lblDate.textAlignment = TextAlign_Left | TextAlign_VertCenter;

   this.editDate  = new Edit(this);
   this.editDate.setFixedWidth(editWidth1);
   this.editDate.rightAlignment  = true;
   this.editDate.toolTip = "<b><p>Observation date</p></b>" +
      "<p>The date is used to calculate the proper motion of stars and must be formatted 'yyyy-mm-dd'</p>";
   this.editDate.onEditCompleted = function()
   {
      var d = new Date(dlg.editDate.text);
      if (isNaN(d))
      {
         errMessage("Date format conversion error, see tooltip");
      }
      else
      {
        // cc.julianDay = julianDay(d);
        // Console.writeln("JulianDay " + cc.julianDay);
      }
   }

   // catalog mag

   this.cbAllStars = new CheckBox(this);
   this.cbAllStars.checked = parms.allStars;
   this.cbAllStars.text = "All stars";
   this.cbAllStars.toolTip = "<b>Downloader</b><p>load all available stars</p>";
   this.cbAllStars.onCheck = function( checked )
   {
      parms.allStars = checked;
      dlg.editMinMag.enabled = !parms.allStars;
      dlg.editMaxMag.enabled = !parms.allStars;
      dlg.btnLoadCat.defaultButton = checked;
   }

   var topLine = new HorizontalSizer();
   topLine.margin = 4;
   //topLine.add(this.cbAllStars);
   topLine.add(this.cbGaiaDr2);
   topLine.addStretch();
   topLine.add(this.lblDate);
   topLine.addSpacing(8);
   topLine.add(this.editDate);


   this.lblMags = new Label(this);
   //this.lblMags.setMinWidth(labelWidth1);
   this.lblMags.text = "G mag range";
   this.lblMags.textAlignment = TextAlign_Left | TextAlign_VertCenter;

   this.lblMinMag = new Label(this);
   //this.lblMinMag.setMinWidth(labelWidth2);
   this.lblMinMag.text = "min: ";
   this.lblMinMag.textAlignment = TextAlign_Left | TextAlign_VertCenter;

   this.lblMaxMag = new Label(this);
   //this.lblMaxMag.setMinWidth(labelWidth2);
   this.lblMaxMag.text = "max: ";
   this.lblMaxMag.textAlignment = TextAlign_Left | TextAlign_VertCenter;

   this.editMinMag  = new Edit(this);
   this.editMinMag.enabled = !parms.allStars;
   this.editMinMag.setFixedWidth(editWidth1);
   this.editMinMag.rightAlignment  = true;
   this.editMinMag.text = parms.minMagCat.toFixed(2);
   this.editMinMag.toolTip = "<b><p>Minimum magnitude</p></b>" +
                             "<p>Catalog download minimal Gmag</p>";
   this.editMinMag.onEditCompleted = function()
   {
      var v = dlg.editMinMag.text.tryToFloat();
      if (v != null) parms.minMagCat = v;
      dlg.btnLoadCat.defaultButton = true;
   }

   this.editMaxMag  = new Edit(this);
   this.editMaxMag.enabled = !parms.allStars;
   this.editMaxMag.setFixedWidth(editWidth1);
   this.editMaxMag.rightAlignment  = true;
   this.editMaxMag.text = (parms.maxMagCat + 1).toFixed(2);
   this.editMaxMag.toolTip = "<b><p>Maximum magnitude</p></b>" +
                             "<p>Catalog download maximal Gmag</p>";
   this.editMaxMag.onEditCompleted = function()
   {
      var v = dlg.editMaxMag.text.tryToFloat();
      if (v != null) parms.maxMagCat = v;
      dlg.btnLoadCat.defaultButton = true;
   }

   var magLine = new HorizontalSizer();
   magLine.margin = 4;
   magLine.add(this.cbAllStars);
   magLine.addStretch();
   magLine.add(this.lblMags);
   magLine.addSpacing(8);
   magLine.add(this.lblMinMag);
   //magLine.addSpacing(8);
   magLine.add(this.editMinMag);
   magLine.addSpacing(8);
   magLine.add(this.lblMaxMag);
   magLine.add(this.editMaxMag);

   // mask mag

   this.lblIMags = new Label(this);
   this.lblIMags.setMinWidth(labelWidth1);
   this.lblIMags.text = "Mask magnitude range";
   this.lblIMags.textAlignment = TextAlign_Left | TextAlign_VertCenter;

   this.lblIMinMag = new Label(this);
   this.lblIMinMag.setMinWidth(labelWidth2);
   this.lblIMinMag.text = "min:";
   this.lblIMinMag.textAlignment = TextAlign_Left | TextAlign_VertCenter;

   this.lblIMaxMag = new Label(this);
   this.lblIMaxMag.setMinWidth(labelWidth2);
   this.lblIMaxMag.text = "max:";
   this.lblIMaxMag.textAlignment = TextAlign_Left | TextAlign_VertCenter;

   this.editIMinMag  = new Edit(this);
   this.editIMinMag.setFixedWidth(editWidth1);
   this.editIMinMag.rightAlignment  = true;
   this.editIMinMag.text = (parms.minMagMask).toString();
   this.editIMinMag.toolTip = "<b><p>Minimum magnitude</p></b>" +
                              "<p>Decimal value 0..21</p>";
   this.editIMinMag.onEditCompleted = function()
   {
      var v = dlg.editIMinMag.text.tryToFloat();
      if (v != null)
      {
         parms.minMagMask = v;
      }
   }
   this.editIMinMag.onEnter = function() {dlg.btnLoadCat.defaultButton = false};

   this.editIMaxMag  = new Edit(this);
   this.editIMaxMag.setFixedWidth(editWidth1);
   this.editIMaxMag.rightAlignment  = true;
   this.editIMaxMag.text = (parms.maxMagMask).toFixed(3);
   this.editIMaxMag.toolTip = "<b><p>Maximum magnitude</p></b>" +
                              "<p>Decimal value 0..21</p>";
   this.editIMaxMag.onEditCompleted = function()
   {
      var v = dlg.editIMaxMag.text.tryToFloat();
      Console.writeln(v);
      if (v != null) parms.maxMagMask = v;
   }
   this.editIMaxMag.onEnter = function() {dlg.btnLoadCat.defaultButton = false};

   var magLineI = new HorizontalSizer();
   magLineI.margin = 4;
   magLineI.add(this.lblIMags);
   magLineI.addStretch();
   magLineI.add(this.lblIMinMag);
   magLineI.add(this.editIMinMag);
   magLineI.addSpacing(8);
   magLineI.add(this.lblIMaxMag);
   magLineI.add(this.editIMaxMag);

   // radius

   this.lblRadi = new Label(this);
   //this.lblRadi.setMinWidth(labelWidth1);
   this.lblRadi.text = "Star radii";
   this.lblRadi.textAlignment = TextAlign_Left | TextAlign_VertCenter;

   this.btnOptimalRadiusMinMag = new ToolButton(this);
   with (this.btnOptimalRadiusMinMag)
   {
      icon = this.scaledResource(":/bullets/bullet-star-red.png");
      toolTip = '<b><p>Set optimal maximum radius</p></b>' +
                'Estimates R = Sigma x 3 from brightest star in the image.' ;

      onPress = function()
      {
         parms.minMagMask = dlg.editIMinMag.text.toNumber();
         var result = magToRadius(cc, parms);
         if (result.radius > 0)
         {
            dlg.editMaxR.text = result.radius.toFixed(3);
         }
         else
         {
            errMessage('<b>Evaluation failed on bright star</b>' +
             '<p>DynamicPSF could not measure the star at ' + result.pos +
             ' with Gmag = ' + result.mag.toFixed(4) + ' </p>' +
             '<p>Please estimate the max. radius</p>');
         }
      }
   }


   this.lblMinR = new Label(this);
   this.lblMinR.setMinWidth(labelWidth2);
   this.lblMinR.text = "min:";
   this.lblMinR.textAlignment = TextAlign_Left | TextAlign_VertCenter;

   this.lblMaxR = new Label(this);
   this.lblMaxR.setMinWidth(labelWidth2);
   this.lblMaxR.text = "max:";
   this.lblMaxR.textAlignment = TextAlign_Left | TextAlign_VertCenter;

   this.editMinR  = new Edit(this);
   this.editMinR.setFixedWidth(editWidth1);
   this.editMinR.rightAlignment  = true;
   this.editMinR.text = parms.minRadius.toFixed(3);
   this.editMinR.toolTip = "<b><p>Radius for the maximum magnitude</p></b>" +
                             "<p>Estimate a value</p>";
   this.editMinR.onEditCompleted = function()
   {
      var v = dlg.editMinR.text.tryToFloat();
      if (v != null) parms.minRadius = v;
   }
   this.editMinR.onEnter = function() {dlg.btnLoadCat.defaultButton = false};

   this.editMaxR  = new Edit(this);
   this.editMaxR.setFixedWidth(editWidth1);
   this.editMaxR.rightAlignment  = true;
   this.editMaxR.text = parms.maxRadius.toFixed(3);
   this.editMaxR.toolTip = "<b><p>Radius for the minimum magnitude</p></b>" +
                             "<p>Estimate a value or click star icon.</p>";
   this.editMaxR.onEditCompleted = function()
   {
      var v = dlg.editMaxR.text.tryToFloat();
      if (v != null) parms.maxRadius = v;
   }
   this.editMaxR.onEnter = function() {dlg.btnLoadCat.defaultButton = false};

   var rLine = new HorizontalSizer();
   rLine.margin = 4;
   rLine.add(this.lblRadi);
   rLine.addStretch();
   rLine.add(this.lblMinR);
   rLine.add(this.editMinR);
   rLine.addSpacing(8);
   rLine.add(this.lblMaxR);
   rLine.add(this.editMaxR);

   var bLine = new HorizontalSizer();
   bLine.margin = 4;
   bLine.addStretch();
   bLine.add(this.btnOptimalRadiusMinMag);


   this.cbRingMask =  new CheckBox(this);
   this.cbRingMask.text = "Ring mask";
   this.cbRingMask.toolTip = "<b>Create a ring mask</p>";
   this.cbRingMask.onCheck = function( checked )
   {
      cc.ringMask = checked;
      dlg.btnLoadCat.defaultButton = false
   }

   this.lblWidth = new Label(this);
   this.lblWidth.setMinWidth(labelWidth2);
   this.lblWidth.text = "max. width:";
   this.lblWidth.textAlignment = TextAlign_Left | TextAlign_VertCenter;

   this.rbInner = new RadioButton(this);
   this.rbInner.checked = true;
   this.rbInner.text = 'inner';
   this.rbInner.toolTip = '<b>Rings inside star radius</p>';

   this.rbInner.onCheck = function( checked )
   {
      cc.inner = checked;
      dlg.btnLoadCat.defaultButton = false
   }

   this.rbOuter = new RadioButton(this);
   this.rbOuter.text = 'outer';
   this.rbOuter.toolTip = '<b>Rings inside star radius</p>';

   this.rbOuter.onCheck = function( checked )
   {
      cc.inner = !checked;
      dlg.btnLoadCat.defaultButton = false
   }

   this.editRingWidth  = new Edit(this);
   this.editRingWidth.setFixedWidth(editWidth1);
   this.editRingWidth.rightAlignment  = true;
   this.editRingWidth.text = parms.maxWidth.toFixed(2);
   this.editRingWidth.toolTip = "<b><p>Linewidth of the ring in pixels</p></b>" +
                             "<p>Decimal value, i.e.: 1.5</p>";
   this.editRingWidth.onEditCompleted = function()
   {
      var v = dlg.editRingWidth.text.tryToFloat();
      if (v != null) parms.maxWidth = v;
   }
   this.editRingWidth.onEnter = function() {dlg.btnLoadCat.defaultButton = false};

   var wLine = new HorizontalSizer();
   wLine.margin = 4;
   wLine.add(this.cbRingMask);
   wLine.addSpacing(8);
   wLine.add(this.rbInner);
   wLine.addSpacing(8);
   wLine.add(this.rbOuter);
   wLine.addStretch();
   wLine.add(this.lblWidth);
   wLine.addSpacing(8);
   wLine.add(this.editRingWidth);

   this.cbSoftEdges = new CheckBox(this);
   this.cbSoftEdges.checked = parms.softEdges;
   this.cbSoftEdges.text = "Soft edges";
   this.cbSoftEdges.toolTip = "<b>Star painting</b><p>paint soft edges, if checked" +
      " or create a strict binary mask when unckecked</p>";
   this.cbSoftEdges.onCheck = function( checked )
   {
      parms.softEdges = checked;
      dlg.btnLoadCat.defaultButton = false
   }

   this.lblPSF = new Label(this);
   this.lblPSF.text = 'PSF option:';
   this.lblPSF.textAlignment = TextAlign_Left | TextAlign_VertCenter;

   this.vbxPSF = new ViewList(this);
   with (this.vbxPSF)
   {
      setScaledMaxWidth(180);

      getMainViews();

      onViewSelected = function( view )
      {
         cc.usePSF = false;
         if (!view.image.isGrayscale)
         {
            errMessage(view.id + ' is not a grayscale image');
            return;
         }
         cc.sx = getKeyValue(view.window, 'SX');
         cc.sy = getKeyValue(view.window, 'SY');
         cc.theta = getKeyValue(view.window, 'THETA');
         if (cc.sx == null || cc.sy == null || cc.theta == null)
         {
            errMessage(view.id + ' is not a PSF image created by PSFImage.js');
            return;
         }
         cc.usePSF = true;
      }
   }

   var seLine = new HorizontalSizer();
   seLine.margin = 4;
   seLine.add(this.cbSoftEdges);
   seLine.addStretch();
   seLine.add(this.lblPSF);
   seLine.addSpacing(8);
   seLine.add(this.vbxPSF);

   this.btnLoadCat = new PushButton(this);
   with (this.btnLoadCat)
   {
      enabled = cc.dataVizieR.filesCompleted();
      icon = this.scaledResource(":/icons/download.png");
      text = "Load catalog";
      toolTip = "<b>Download catalog</b>" +
         "<p>The downloader works with either cone search or boxes of sub fields.</p>" +
         "<p>1. Cone search:</p>" +
         "<p><t>Uses a service from the University of Heidelberg. </p>" +
         "<p>2. Boxes search:</p>" +
         "<p><t>Uses a service from VizieR catalogs. The fov is subdivided " +
         "as necessary into boxes covering the full area." +
         "Each box is dimensioned to 1x1 degree or smaller.</p>";

      onPress = function()
      {
         dlg.btnLoadCat.enabled = false;
         cc.progress = 0;
         cc.download = true;
         dlg.lblProgress.update();
         processEvents();

         parms.maxMagCat  = dlg.editMaxMag.text.toNumber();
         parms.minMagCat  = dlg.editMinMag.text.toNumber();

         parms.maxMagMask  = dlg.editIMaxMag.text.toNumber();
         parms.minMagMask  = dlg.editIMinMag.text.toNumber();

         dlg.lblProgress.update();
         processEvents();
         //
         // add one descriptor per segment
         //
         for (var i = 0; i < cc.boxes.length; i++)
         {
            var box = cc.boxes[i];
            var binfile = parms.dataFolder + '/' + cc.dataVizieR.baseFile +
                           '[' + cc.dataVizieR.getnextIndex().toString() + '].bin';

            cc.dataVizieR.addNewDescriptor(
               fileDescriptor(binfile, false, '',
                 	            parms.minMagCat, parms.maxMagCat,
                              cc.catalogName,
                              box.ra, box.dec, 0,
                              [box.width, box.height],
                              0));
         }

         if ( downloadSegments(cc.dataVizieR, cc.columns, parms.VizierSite, parms.allStars, refeshProgress))
         {
            //catalogGridView(cc, dlg.treebox);             // view in TreeBox

            nextMagRangeToEdit(dlg.editMinMag, dlg.editMaxMag, cc, parms);

            dlg.btnLoadCat.enabled = cc.dataVizieR.filesCompleted();
            dlg.btnReloadCat.enabled = !cc.dataVizieR.filesCompleted();
            dlg.btnExec.enabled = cc.dataVizieR.filesCompleted() && cc.dataVizieR.getDataInfo().records > 0;

            dlg.editIMinMag.text = cc.dataVizieR.getDataInfo().minMag.toFixed(3);

            cc.download = false;
         }
         else
         {
            dlg.btnReloadCat.enabled = true;
         }
      }
   }
   this.btnReloadCat = new PushButton(this);
   with (this.btnReloadCat)
   {
      enabled = !cc.dataVizieR.filesCompleted();
      text    = 'ReLoad';

      onPress = function()
      {
         enabled = false;

         if ( downloadSegments(cc.dataVizieR, cc.columns, parms.VizierSite, parms.allStars, refeshProgress))
         {
            //catalogGridView(cc, dlg.treebox);             // view in TreeBox

            dlg.btnLoadCat.enabled = cc.dataVizieR.filesCompleted();
            dlg.btnReloadCat.enabled = !cc.dataVizieR.filesCompleted();
            dlg.btnExec.enabled = cc.dataVizieR.filesCompleted() && cc.dataVizieR.getDataInfo().records > 0;
            dlg.editIMinMag.text = (cc.dataVizieR.getDataInfo().minMag).toFixed(3);
         }
         else
         {
            dlg.btnReloadCat.enabled = true;
         }
      }
   }

   function refeshProgress(numDownloads, downloaded)
   {
      cc.progress = downloaded / numDownloads;
      dlg.lblProgress.update();
      catalogGridView(cc, dlg.treebox);             // view in TreeBox
   }

   this.lblProgress = new Frame(this);
   this.lblProgress.setScaledFixedSize(160, 20);
   this.lblProgress.onPaint = function( x0, y0, x1, y1 )
   {
      var w = cc.progress * (x1 - x0);
      var g = new Graphics();
      g.begin(this);
      g.fillRect(x0, y0, x1, y1, new Brush(0xffc4c4c4));
      g.fillRect(x0, y0, w, y1, new Brush(0xff0000fe));
      g.drawRect(x0, y0, x1, y1);
      g.end();
   }

   var catLine = new HorizontalSizer();
   catLine.margin = 4;
   catLine.add(this.btnLoadCat);
   catLine.addSpacing(8);
   catLine.add(this.btnReloadCat);
   catLine.addStretch();
   catLine.add(this.lblProgress);

   this.lblWork = new Label(this);
   this.lblWork.text = parms.dataFolder;

   this.btnFolderSelect = new ToolButton(this);
   with (this.btnFolderSelect)
   {
      icon = this.scaledResource(':/file-explorer/folder-new.png');
      toolTip = "<b>Change data folder</b>";

      onPress = function()
      {
         var d = new GetDirectoryDialog();
         if (d.execute())
         {
            parms.dataFolder = d.directory;
            dlg.lblWork.text = parms.dataFolder;

            cc.dataVizieR = new MaskGenData(parms.dataFolder, cc.id, cc.ra, cc.dec);

            catalogGridView(cc, dlg.treebox);

            Settings.write(ID + "/parms", DataType_String, JSON.stringify(parms));
         }
      }
   }


   var folderSizer = new HorizontalSizer();
   folderSizer.margin = 4;
   folderSizer.add(this.btnFolderSelect);
   folderSizer.addSpacing(8);
   folderSizer.add(this.lblWork);


   this.treebox = new TreeBox(this);
   with (this.treebox)
   {
      multipleSelection = false;
      nodeExpansion = true;
      numberOfColumns =  6;
      rootDecoration  = false;
      var hdr = 'Valid,File,MinMag,MaxMag,Stars,Source'.split(',');
      for (var i = 0; i < hdr.length; i++) setHeaderText(i, hdr[i]);
      setScaledMinHeight(120);
   }


   this.lblArea = new Label(this);
   this.lblArea.text = "Area: ";
   this.lblArea.textAlignment = TextAlign_Left | TextAlign_VertCenter;

   this.lblSites = new Label(this);
   this.lblSites.text = "Server site:";
   this.lblSites.textAlignment = TextAlign_Left | TextAlign_VertCenter;

   this.cmbSites = new ComboBox(this);
   with (this.cmbSites)
   {
      setScaledMaxWidth(180);
      for (var i in sites) addItem(sites[i]);
      if (parms.VizierSite == "") parms.VizierSite = sites[0];
      currentItem = Math.max(0, sites.indexOf(parms.VizierSite));
      parms.VizierSite = sites[currentItem];

      dlg.lblProgress.visible = true;
      dlg.editMinMag.enabled = !parms.allStars;
      dlg.editMaxMag.enabled = !parms.allStars;

      dlg.lblArea.text = "Area: " + cc.boxArea.toFixed(4) + " degree^2";

      onItemSelected = function( itemIndex )
      {
         parms.VizierSite = sites[itemIndex];
         dlg.lblProgress.visible = true;
         dlg.editMinMag.enabled = !parms.allStars;
         dlg.editMaxMag.enabled = !parms.allStars;
         dlg.lblArea.text = "Area: " + cc.boxArea.toFixed(4) + " deg^2";
      }
   }

   var sitesLine = new HorizontalSizer();
   sitesLine.margin = 4;
   sitesLine.add(this.lblArea);
   sitesLine.addStretch();
   sitesLine.add(this.lblSites);
   sitesLine.addSpacing(8);
   sitesLine.add(this.cmbSites);


   //

   this.gbxVizier = new GroupBox(this);
   with (this.gbxVizier)
   {
      enabled = !cc.GaiaDR3using;// !this.cbGaiaDr2.checked;
      title = "VizieR catalog settings";
      sizer = new VerticalSizer();
      sizer.addSpacing(8);
      sizer.add(magLine);
      sizer.addSpacing(8);
      sizer.add(catLine);
      sizer.addSpacing(8);
      sizer.add(sitesLine);
      sizer.addSpacing(8);
      //sizer.add(folderSizer);
      sizer.addSpacing(8);
      sizer.add(this.treebox);
   }


   this.gbx = new GroupBox(this);
   with (this.gbx)
   {
      title = "Mask settings";
      sizer = new VerticalSizer();
      sizer.margin = 4;
      sizer.add(topLine);
      sizer.addSpacing(8);
      sizer.add(folderSizer);
      sizer.addSpacing(8);
      sizer.add(this.gbxVizier);
/*      sizer.add(magLine);
      sizer.addSpacing(8);
      sizer.add(catLine);
      sizer.addSpacing(8);
      sizer.add(folderSizer);
      sizer.addSpacing(8);
      sizer.add(this.treebox);*/
      sizer.addSpacing(8);
      sizer.add(magLineI);
      sizer.addSpacing(8);
      sizer.add(rLine);
      sizer.add(bLine);
      sizer.addSpacing(8);
      sizer.add(wLine);
      sizer.addSpacing(8);
      sizer.add(seLine);
      sizer.addSpacing(8);
      //sizer.add(sitesLine);
   }

   this.newInstance_Button = new ToolButton(this);
   this.newInstance_Button.icon = new Bitmap( ":/process-interface/new-instance.png" );
   this.newInstance_Button.toolTip = "New Instance";
   this.newInstance_Button.onMousePress = function()
   {
      this.hasFocus = true;
      exportGccParms(parms);
      this.pushed = false;
      this.dialog.newInstance();
   };

   this.btnCancel = new PushButton(this);
   with (this.btnCancel)
   {
      icon = this.scaledResource(":/icons/cancel.png");
      text = "Cancel";
      toolTip = "<b>Exit this script</b>";
      onPress = function()
      {
         if (cc.download)
         {
            var q = new MessageBox("Stop downloading catalog?",
               "Warning", StdIcon_Question,
               StdButton_No, StdButton_Yes);
            if (q.execute() == StdButton_Yes)
            {
               cc.download = false;
               return;
            }
         }
         else
            dlg.done(0);
      }
   }

   this.btnExec = new PushButton(this);
   with (this.btnExec)
   {
      enabled = true;// cc.GaiaDR3enabled;
      icon = this.scaledResource(":/icons/execute.png");
      text = "Execute";
      toolTip = "<b>Create mask</b>";
      onClick = function(checked)
      {
         dlg.btnExec.enabled = false;
         if (cc.GaiaDR3using)
         {
            dlg.btnLoadCat.defaultButton = false

            loadLocalDR3(cc, parms);

            cc.dataExec = new GaiaDR3File(cc.GaiaDR3File);
         }
         else
         {
            cc.dataExec = cc.dataVizieR;
         }
         //
         // calc scales
         //
         //parms.radiusScale     = (parms.maxRadius - parms.minRadius) /
         //                        Math.log(1 + parms.maxMagMask);

         parms.minMagMask = dlg.editIMinMag.text.toNumber();
         parms.maxMagMask = dlg.editIMaxMag.text.toNumber();

         parms.minRadius  = dlg.editMinR.text.toNumber();
         parms.maxRadius  = dlg.editMaxR.text.toNumber();

         parms.ringWidthScale  = (parms.maxWidth - parms.minWidth) /
                                 Math.log(1 + parms.maxMagMask);
         //Console.writeln("ringWidthScale: " + parms.ringWidthScale);
         //
         // years since 2000
         //
         cc.years = (cc.julianDay - 2451545.0) / 365.25;
         Console.writeln("Years since 2000: " + cc.years.toFixed(2));
         Console.flush();

         var keywords = [];

         keywords.push(new FITSKeyword("SCRIPT","'MaskGen'", "Version " + VERSION));
         var id = cc.window.mainView.id;
         if (id.length > 18) id = id.substr(0, 18);
         keywords.push(new FITSKeyword("SOURCE", "'" + id + "'",
            "Source image for this mask"));
         keywords.push(new FITSKeyword("MAXMAG", parms.maxMagMask.toString(),
            "Maximal magnitude"));
         keywords.push(new FITSKeyword("MINMAG", parms.minMagMask.toString(),
            "Minimal magnitude"));
         keywords.push(new FITSKeyword("MAXRAD", parms.maxRadius.toString(),
            "Radius at minimal magnitude"));
         keywords.push(new FITSKeyword("MINRAD", parms.minRadius.toString(),
            "Radius at maximal magnitude"));
         keywords.push(new FITSKeyword("OBJCTRA", '\'' + DMSangle.FromAngle(cc.ra / 15).ToString(true) + '\'',
            "Right ascension of source image"));
         keywords.push(new FITSKeyword("OBJCTDEC", '\'' + DMSangle.FromAngle(cc.dec).ToString() + '\'',
            "Declination of source image"));

         parms.ringMask = false;

         var idExt   = '_mask';
         if (cc.ringMask)
         {
            if (cc.inner)
               idExt   = '_Imask';
            else
               idExt   = '_Omask';
         }

         var mask1Id = getNewName(cc.window.mainView.id, idExt);
         var view1   = maskView(cc, parms, mask1Id, keywords);
         if (view1 == null)
         {
            errMessage('No mask created');
            dlg.btnExec.enabled = true;
            return;
         }
         var maskWin = null;

         if (cc.ringMask)
         {
            parms.ringMask = true;
            var mask2Id = getNewName('temp', '_mask');
            var view2   = maskView(cc, parms, mask2Id, keywords);
            if (view2 == null)
            {
               errMessage('No mask created');
               dlg.btnExec.enabled = true;
               return;
            }

            var P = new PixelMath;
            if (cc.inner)
               P.expression = '$T * ~' + view2.id;
            else
               P.expression = '~$T * ' + view2.id;
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
            P.executeOn(view1, false);
            view2.window.forceClose();
         }

         maskWin = view1.window;

         maskWin.show();

         Console.writeln("Mask id created:  " + maskWin.mainView.id);
         Console.writeln("Stars painted:    " + cc.starsPainted);
         Console.writeln("Stars within mag: " + cc.starsInMags);
         dlg.btnExec.enabled = true;
      }
   }

   this.btnOK = new PushButton(this);
   with (this.btnOK)
   {
      icon = this.scaledResource(":/icons/ok.png");
      text = "OK";
      toolTip = "<b>Quit this script</b>";
      onPress = function()
      {
         Console.writeln("Script " + ID + " end");
         Settings.write(ID + "/parms", DataType_String, JSON.stringify(parms));
         Console.hide();
         dlg.done(0);
      }
   }

   var btnLine = new HorizontalSizer();
   btnLine.margin = 4;
   btnLine.add(this.newInstance_Button)
   btnLine.addStretch();
   btnLine.add(this.btnExec);
   btnLine.addStretch();
   btnLine.add(this.btnOK);
   btnLine.add(this.btnCancel);


   this.sizer = new VerticalSizer();
   this.sizer.margin = 4;
   this.sizer.add(topLineSizer);
   this.sizer.add(this.lblView);
   this.sizer.addSpacing(8);
   this.sizer.add(this.gbx);
   this.sizer.addSpacing(8);
   this.sizer.add(btnLine);

   this.windowTitle = ID + " " + VERSION;

	this.adjustToContents();
 	this.userResizable = false;

   // end GUI contruction

   var dateObs = getKeyString(cc.window, "DATE-OBS");
   if (dateObs == null)
   {
      var fi = new FileInfo(cc.window.filePath);
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

   cc.julianDay = julianDay(dateObs);
   this.editDate.text = dateObs;

   if (cc.dataVizieR.filesCompleted() && cc.dataVizieR.getDataInfo().records > 0)
      this.editIMinMag.text = cc.dataVizieR.getDataInfo().minMag.toFixed(3);


   catalogGridView(cc, this.treebox);

   nextMagRangeToEdit(this.editMinMag, this.editMaxMag, cc, parms);

   //this.btnExec.enabled = cc.dataVizieR.getDataInfo().records > 0;
   this.lblProgress.update();

   processEvents();

   var cw = (this.treebox.width - (this.treebox.numberOfColumns -1)) /
             this.treebox.numberOfColumns;
   for (var col = 0; col < this.treebox.numberOfColumns; col++)
   {
      this.treebox.setColumnWidth(col, cw);
   }
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
   var view        = cc.window.mainView;
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
   new MessageBox(txt, ID, StdIcon_Error).execute();
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


function julianDay(ISODate)
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


function getNewName(name, suffix)
{
   var newName = name + suffix;
   let n = 1;
   while (!ImageWindow.windowById(newName).isNull)
   {
      ++n;
      newName = name + suffix + n;
   }
   return newName;
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

function GaiaDR3File(FilePath)
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


showDialog.prototype = new Dialog;
infoDialog.prototype = new Dialog;


function main()
{
   // *******************************************************************************
   //
   // check view on color and WCS
   //

   var window = ImageWindow.activeWindow;

   if ( window.isNull )
   {
      errMessage( "No active image" );
      return;
   }
   try
   {
      window.regenerateAstrometricSolution();
   }
   catch (ex) {}

   if ( window.astrometricSolution() == null )
   {
      errMessage( "Image has no astrometric solution" );
      return;
   }

   var ctype1Comment = getKeyComment(window, 'CTYPE1');
   var ctype2Comment = getKeyComment(window, 'CTYPE2');

   if (getProjection(ctype1Comment) != 'Gnomonic' || getProjection(ctype2Comment) != 'Gnomonic')
   {
      errMessage( "Image not solved with gnomonic projection" );
   }


   // *******************************************************************************
   // run dialog
   // *******************************************************************************
   Console.show();
 	var dialog = new showDialog(window);
   if (Parameters.isGlobalTarget) {
      // show the dialog, user interaction mode
	   dialog.execute();
   } else {
      // run with parameters on the target view
      dialog.btnExec.onClick(true);
   }
}

main();
