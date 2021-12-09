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
#include <pjsr/SampleType.jsh>
#include <pjsr/Color.jsh>
#include <pjsr/StdIcon.jsh>
#include <pjsr/StdCursor.jsh>

#include "astroninjaus_BetterMaskGen_Library.js"

#feature-id  Utilities > MaskGen

#define ID                 "MaskGen"
#define TITLE              "Mask Generator"
#define VERSION            "1.4.3"


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

   // create an initialize cc with cControl(window, parms, dialog)
   var cc = new cControl(imageWindow, parms, this);

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

         var idExt   = '_mask';
         if (cc.ringMask)
         {
            if (cc.inner)
               idExt   = '_Imask';
            else
               idExt   = '_Omask';
         }

         // error messages are shown as part of this function
         var view = MaskGen_execute(cc, parms, format("%s%s", cc.window.mainView.id, idExt), keywords);
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

   cc.julianDay = JulianDay(dateObs);
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
   if (Parameters.isGlobalTarget) {
      // show the dialog, user interaction mode
      var dialog = new showDialog(window);
	   dialog.execute();
   } else {
      // run with parameters on the target view
      autoMaskGen(window, "test_mask_id");
      // dialog.btnExec.onClick(true);
   }
}

main();
