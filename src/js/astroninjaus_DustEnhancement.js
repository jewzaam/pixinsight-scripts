//
// DustEnhancement, enhance dust in an image by using various wavelet layers
//
// Copyright Naveen Malik, 2021
//
// History
//      2021-08-XX     0.0.1   First release.
//       

#feature-id  jewzaam > Dust Enhancement

#define ID                 "DustEnhancement"
#define TITLE              "Dust Enhancement"
#define VERSION            "0.0.1"
#define AUTHOR             "Naveen Malik"

#feature-info  A utility script that uses wavelet layers to create enhancement in faint dust.

#include <pjsr/Sizer.jsh>
#include <pjsr/FrameStyle.jsh>
#include <pjsr/TextAlign.jsh>
#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>
#include <pjsr/StdCursor.jsh>
#include <pjsr/UndoFlag.jsh>

function setATrousWaveletTransformLayers(P, layers)
{
   // must have at least one layer
   if (layers < 1) {
      layers = 1;
   }
   var newLayers = [];
   for (var i = 0; i < layers; i++)
   {
      newLayers.push([false, true, 0.000, false, 3.000, 1.00, 1]);
   }
   // residual is the only one we keep
   newLayers.push([true, true, 0.000, false, 3.000, 1.00, 1]);
   P.layers = newLayers;
   return P;
}

function ATrousWaveletTransformGaussian5(layers)
{
   var P = new ATrousWaveletTransform;
   P.layers = [ // enabled, biasEnabled, bias, noiseReductionEnabled, noiseReductionThreshold, noiseReductionAmount, noiseReductionIterations
      [true, true, 0.000, false, 3.000, 1.00, 1],
      [true, true, 0.000, false, 3.000, 1.00, 1]
   ];
   P.scaleDelta = 0;
   P.scalingFunctionData = [
      0.0001,0.003162,0.01,0.003162,0.0001,
      0.003162,0.1,0.316228,0.1,0.003162,
      0.01,0.316228,1,0.316228,0.01,
      0.003162,0.1,0.316228,0.1,0.003162,
      0.0001,0.003162,0.01,0.003162,0.0001
   ];
   P.scalingFunctionRowFilter = [
      0.01,0.316228,
      1,0.316228,
      0.01
   ];
   P.scalingFunctionColFilter = [
      0.01,0.316228,
      1,0.316228,
      0.01
   ];
   P.scalingFunctionNoiseSigma = [
      0.6788,0.2809,0.1331,
      0.0666,0.0339,0.0174,
      0.009,0.0047,0.0024,
      0.0013
   ];
   P.scalingFunctionName = "Gaussian (5)";
   P.largeScaleFunction = ATrousWaveletTransform.prototype.NoFunction;
   P.curveBreakPoint = 0.75;
   P.noiseThresholding = false;
   P.noiseThresholdingAmount = 1.00;
   P.noiseThreshold = 3.00;
   P.softThresholding = true;
   P.useMultiresolutionSupport = false;
   P.deringing = false;
   P.deringingDark = 0.1000;
   P.deringingBright = 0.0000;
   P.outputDeringingMaps = false;
   P.lowRange = 0.0000;
   P.highRange = 0.0000;
   P.previewMode = ATrousWaveletTransform.prototype.Disabled;
   P.previewLayer = 0;
   P.toLuminance = true;
   P.toChrominance = true;
   P.linear = false;
   return setATrousWaveletTransformLayers(P, layers);
}
function ATrousWaveletTransformGaussian7(layers)
{
   var P = new ATrousWaveletTransform;
   P.layers = [ // enabled, biasEnabled, bias, noiseReductionEnabled, noiseReductionThreshold, noiseReductionAmount, noiseReductionIterations
      [true, true, 0.000, false, 3.000, 1.00, 1],
      [true, true, 0.000, false, 3.000, 1.00, 1]
   ];
   P.scaleDelta = 0;
   P.scalingFunctionData = [
      0.0001,0.001292,0.005995,0.01,0.005995,0.001292,0.0001,
      0.001292,0.016681,0.077426,0.129155,0.077426,0.016681,0.001292,
      0.005995,0.077426,0.359381,0.599484,0.359381,0.077426,0.005995,
      0.01,0.129155,0.599484,1,0.599484,0.129155,0.01,
      0.005995,0.077426,0.359381,0.599484,0.359381,0.077426,0.005995,
      0.001292,0.016681,0.077426,0.129155,0.077426,0.016681,0.001292,
      0.0001,0.001292,0.005995,0.01,0.005995,0.001292,0.0001
   ];
   P.scalingFunctionRowFilter = [
      0.01,0.129155,
      0.599484,1,
      0.599484,0.129155,
      0.01
   ];
   P.scalingFunctionColFilter = [
      0.01,0.129155,
      0.599484,1,
      0.599484,0.129155,
      0.01
   ];
   P.scalingFunctionNoiseSigma = [
      0.8693,0.2078,0.0875,
      0.042,0.0209,0.0104,
      0.0053,0.0027,0.0014,
      0.0007
   ];
   P.scalingFunctionName = "Gaussian (7)";
   P.largeScaleFunction = ATrousWaveletTransform.prototype.NoFunction;
   P.curveBreakPoint = 0.75;
   P.noiseThresholding = false;
   P.noiseThresholdingAmount = 1.00;
   P.noiseThreshold = 3.00;
   P.softThresholding = true;
   P.useMultiresolutionSupport = false;
   P.deringing = false;
   P.deringingDark = 0.1000;
   P.deringingBright = 0.0000;
   P.outputDeringingMaps = false;
   P.lowRange = 0.0000;
   P.highRange = 0.0000;
   P.previewMode = ATrousWaveletTransform.prototype.Disabled;
   P.previewLayer = 0;
   P.toLuminance = true;
   P.toChrominance = true;
   P.linear = false;
   return setATrousWaveletTransformLayers(P, layers);
}
function ATrousWaveletTransformGaussian9(layers)
{
   var P = new ATrousWaveletTransform;
   P.layers = [ // enabled, biasEnabled, bias, noiseReductionEnabled, noiseReductionThreshold, noiseReductionAmount, noiseReductionIterations
      [true, true, 0.000, false, 3.000, 1.00, 1],
      [true, true, 0.000, false, 3.000, 1.00, 1]
   ];
   P.scaleDelta = 0;
   P.scalingFunctionData = [
      0.0001,0.00075,0.003162,0.007499,0.01,0.007499,0.003162,0.00075,0.0001,
      0.00075,0.005623,0.023714,0.056234,0.074989,0.056234,0.023714,0.005623,0.00075,
      0.003162,0.023714,0.1,0.237137,0.316228,0.237137,0.1,0.023714,0.003162,
      0.007499,0.056234,0.237137,0.562341,0.749894,0.562341,0.237137,0.056234,0.007499,
      0.01,0.074989,0.316228,0.749894,1,0.749894,0.316228,0.074989,0.01,
      0.007499,0.056234,0.237137,0.562341,0.749894,0.562341,0.237137,0.056234,0.007499,
      0.003162,0.023714,0.1,0.237137,0.316228,0.237137,0.1,0.023714,0.003162,
      0.00075,0.005623,0.023714,0.056234,0.074989,0.056234,0.023714,0.005623,0.00075,
      0.0001,0.00075,0.003162,0.007499,0.01,0.007499,0.003162,0.00075,0.0001
   ];
   P.scalingFunctionRowFilter = [
      0.01,0.074989,0.316228,
      0.749894,1,0.749894,
      0.316228,0.074989,0.01
   ];
   P.scalingFunctionColFilter = [
      0.01,0.074989,0.316228,
      0.749894,1,0.749894,
      0.316228,0.074989,0.01
   ];
   P.scalingFunctionNoiseSigma = [
      0.9287,0.1565,0.0657,
      0.0316,0.0157,0.0078,
      0.0039,0.002,0.0011,
      0.0009
   ];
   P.scalingFunctionName = "Gaussian (9)";
   P.largeScaleFunction = ATrousWaveletTransform.prototype.NoFunction;
   P.curveBreakPoint = 0.75;
   P.noiseThresholding = false;
   P.noiseThresholdingAmount = 1.00;
   P.noiseThreshold = 3.00;
   P.softThresholding = true;
   P.useMultiresolutionSupport = false;
   P.deringing = false;
   P.deringingDark = 0.1000;
   P.deringingBright = 0.0000;
   P.outputDeringingMaps = false;
   P.lowRange = 0.0000;
   P.highRange = 0.0000;
   P.previewMode = ATrousWaveletTransform.prototype.Disabled;
   P.previewLayer = 0;
   P.toLuminance = true;
   P.toChrominance = true;
   P.linear = false;
   return setATrousWaveletTransformLayers(P, layers);
}
function ATrousWaveletTransformGaussian11(layers)
{
   var P = new ATrousWaveletTransform;
   P.layers = [ // enabled, biasEnabled, bias, noiseReductionEnabled, noiseReductionThreshold, noiseReductionAmount, noiseReductionIterations
      [true, true, 0.000, false, 3.000, 1.00, 1],
      [true, true, 0.000, false, 3.000, 1.00, 1]
   ];
   P.scaleDelta = 0;
   P.scalingFunctionData = [
      0.0001,0.000525,0.001905,0.004786,0.008318,0.01,0.008318,0.004786,0.001905,0.000525,0.0001,
      0.000525,0.002754,0.01,0.025119,0.043652,0.052481,0.043652,0.025119,0.01,0.002754,0.000525,
      0.001905,0.01,0.036308,0.091201,0.158489,0.190546,0.158489,0.091201,0.036308,0.01,0.001905,
      0.004786,0.025119,0.091201,0.229087,0.398107,0.47863,0.398107,0.229087,0.091201,0.025119,0.004786,
      0.008318,0.043652,0.158489,0.398107,0.691831,0.831764,0.691831,0.398107,0.158489,0.043652,0.008318,
      0.01,0.052481,0.190546,0.47863,0.831764,1,0.831764,0.47863,0.190546,0.052481,0.01,
      0.008318,0.043652,0.158489,0.398107,0.691831,0.831764,0.691831,0.398107,0.158489,0.043652,0.008318,
      0.004786,0.025119,0.091201,0.229087,0.398107,0.47863,0.398107,0.229087,0.091201,0.025119,0.004786,
      0.001905,0.01,0.036308,0.091201,0.158489,0.190546,0.158489,0.091201,0.036308,0.01,0.001905,
      0.000525,0.002754,0.01,0.025119,0.043652,0.052481,0.043652,0.025119,0.01,0.002754,0.000525,
      0.0001,0.000525,0.001905,0.004786,0.008318,0.01,0.008318,0.004786,0.001905,0.000525,0.0001
   ];
   P.scalingFunctionRowFilter = [
      0.01,0.052481,0.190546,
      0.47863,0.831764,1,
      0.831764,0.47863,0.190546,
      0.052481,0.01
   ];
   P.scalingFunctionColFilter = [
      0.01,0.052481,0.190546,
      0.47863,0.831764,1,
      0.831764,0.47863,0.190546,
      0.052481,0.01
   ];
   P.scalingFunctionNoiseSigma = [
      0.9549,0.1252,0.0526,
      0.0253,0.0125,0.0063,
      0.0032,0.0016,0.0008,
      0.0004
   ];
   P.scalingFunctionName = "Gaussian (11)";
   P.largeScaleFunction = ATrousWaveletTransform.prototype.NoFunction;
   P.curveBreakPoint = 0.75;
   P.noiseThresholding = false;
   P.noiseThresholdingAmount = 1.00;
   P.noiseThreshold = 3.00;
   P.softThresholding = true;
   P.useMultiresolutionSupport = false;
   P.deringing = false;
   P.deringingDark = 0.1000;
   P.deringingBright = 0.0000;
   P.outputDeringingMaps = false;
   P.lowRange = 0.0000;
   P.highRange = 0.0000;
   P.previewMode = ATrousWaveletTransform.prototype.Disabled;
   P.previewLayer = 0;
   P.toLuminance = true;
   P.toChrominance = true;
   P.linear = false;
   return setATrousWaveletTransformLayers(P, layers);
}

// returns the new window
function cloneView(sourceView, id)
{
   var sourceImage = sourceView.image;
   var tmp = new ImageWindow(sourceImage.width,
      sourceImage.height, sourceImage.numberOfChannels, 
      sourceImage.bitsPerSample, sourceImage.isReal, 
      sourceImage.isColor, id);
   var tmpView = tmp.mainView;
   tmpView.beginProcess( UndoFlag_NoSwapFile );
   tmpView.image.apply(sourceImage);
   tmpView.endProcess();
   return tmp;
}

function TEST()
{
   var P = new ATrousWaveletTransform;
   P.layers = [ // enabled, biasEnabled, bias, noiseReductionEnabled, noiseReductionThreshold, noiseReductionAmount, noiseReductionIterations
      [false, true, 0.000, false, 3.000, 1.00, 1],
      [false, true, 0.000, false, 3.000, 1.00, 1],
      [false, true, 0.000, false, 3.000, 1.00, 1],
      [false, true, 0.000, false, 3.000, 1.00, 1],
      [true, true, 0.000, false, 3.000, 1.00, 1]
   ];
   P.scaleDelta = 0;
   P.scalingFunctionData = [
      0.0001,0.003162,0.01,0.003162,0.0001,
      0.003162,0.1,0.316228,0.1,0.003162,
      0.01,0.316228,1,0.316228,0.01,
      0.003162,0.1,0.316228,0.1,0.003162,
      0.0001,0.003162,0.01,0.003162,0.0001
   ];
   P.scalingFunctionRowFilter = [
      0.01,0.316228,
      1,0.316228,
      0.01
   ];
   P.scalingFunctionColFilter = [
      0.01,0.316228,
      1,0.316228,
      0.01
   ];
   P.scalingFunctionNoiseSigma = [
      0.6788,0.2809,0.1331,
      0.0666,0.0339,0.0174,
      0.009,0.0047,0.0024,
      0.0013
   ];
   P.scalingFunctionName = "Gaussian (5)";
   P.largeScaleFunction = ATrousWaveletTransform.prototype.NoFunction;
   P.curveBreakPoint = 0.75;
   P.noiseThresholding = false;
   P.noiseThresholdingAmount = 1.00;
   P.noiseThreshold = 3.00;
   P.softThresholding = true;
   P.useMultiresolutionSupport = false;
   P.deringing = false;
   P.deringingDark = 0.1000;
   P.deringingBright = 0.0000;
   P.outputDeringingMaps = false;
   P.lowRange = 0.0000;
   P.highRange = 0.0000;
   P.previewMode = ATrousWaveletTransform.prototype.Disabled;
   P.previewLayer = 0;
   P.toLuminance = true;
   P.toChrominance = true;
   P.linear = false;
   return P
}

function removeStars(view) 
{
   var P = new StarNet;
   P.stride = StarNet.prototype.Stride_128;
   P.mask = false;
   P.executeOn(view, false);   
}

function greyscale(view)
{
   var P = new PixelMath;
   P.expression = "$T[0]+$T[1]+$T[2]";
   P.expression1 = "$T[0]+$T[1]+$T[2]";
   P.expression2 = "$T[0]+$T[1]+$T[2]";
   P.useSingleExpression = false;
   P.generateOutput = true;
   P.singleThreaded = false;
   P.optimization = true;
   P.use64BitWorkingImage = false;
   P.rescale = true;
   P.rescaleLower = 0;
   P.rescaleUpper = 1;
   P.truncate = true;
   P.truncateLower = 0;
   P.truncateUpper = 1;
   P.createNewImage = false;
   P.executeOn(view, false);
}

/*
 * Script entry point.
 */
function main()
{
   console.show();
   var window = ImageWindow.activeWindow;
   if ( !window )
   {
      (new MessageBox( "There is no active image window!",
                       TITLE, StdIcon_Error, StdButton_Ok )).execute();
      return;
   }

   var sourceView = window.currentView;

   // clone so we can create a starless view
   var starlessWindow = cloneView(sourceView, format("_%s_starless", sourceView.id));
   // extract (remove) stars
   removeStars(starlessWindow.mainView);
   // fabricate star mask from removed stars
   var starmaskWindow = cloneView(sourceView, format("_%s_starmask", sourceView.id));
   starmaskWindow.show();
   var PM = new PixelMath;
   PM.expression = format("%s - %s", sourceView.id, starlessWindow.mainView.id);
   PM.executeOn(starmaskWindow.mainView, false);
   // grab a copy of just stars for final star repair
   var starrepairWindow = cloneView(starmaskWindow.mainView, format("_%s_starrepair", sourceView.id));
   starrepairWindow.show();
   greyscale(starmaskWindow.mainView);
   var MT = new MorphologicalTransformation;
   MT.operator = MorphologicalTransformation.prototype.Dilation;
   MT.interlacingDistance = 1;
   MT.lowThreshold = 0.000000;
   MT.highThreshold = 0.000000;
   MT.numberOfIterations = 1;
   MT.amount = 1.00;
   MT.selectionPoint = 0.50;
   MT.structureSize = 15;
   MT.structureWayTable = [ // mask
      [[
         0x00,0x00,0x00,0x00,0x00,0x01,0x01,0x01,0x01,0x01,0x00,0x00,0x00,0x00,0x00,
         0x00,0x00,0x00,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x00,0x00,0x00,
         0x00,0x00,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x00,0x00,
         0x00,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x00,
         0x00,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x00,
         0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,
         0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,
         0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,
         0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,
         0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,
         0x00,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x00,
         0x00,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x00,
         0x00,0x00,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x00,0x00,
         0x00,0x00,0x00,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x00,0x00,0x00,
         0x00,0x00,0x00,0x00,0x00,0x01,0x01,0x01,0x01,0x01,0x00,0x00,0x00,0x00,0x00
      ]]
   ];
   MT.executeOn(starmaskWindow.mainView, false)
   // further star removal on the starless with MMT
   starlessWindow.show();
   starlessWindow.mask = starmaskWindow;
   starlessWindow.maskEnabled = true;
   starlessWindow.maskVisible = false;
   starlessWindow.maskInverted = false;
   var MMT = new MultiscaleMedianTransform;
   MMT.layers = [ // enabled, biasEnabled, bias, noiseReductionEnabled, noiseReductionThreshold, noiseReductionAmount, noiseReductionAdaptive
      [false, true, 0.000, false, 1.0000, 1.00, 0.0000],
      [false, true, 0.000, false, 1.0000, 1.00, 0.0000],
      [false, true, 0.000, false, 1.0000, 1.00, 0.0000],
      [false, true, 0.000, false, 1.0000, 1.00, 0.0000],
      [false, true, 0.000, false, 1.0000, 1.00, 0.0000],
      [false, true, 0.000, false, 1.0000, 1.00, 0.0000],
      [false, true, 0.000, false, 1.0000, 1.00, 0.0000],
      [false, true, 0.000, false, 1.0000, 1.00, 0.0000],
      [true, true, 0.000, false, 1.0000, 1.00, 0.0000]
   ];
   MMT.executeOn(starlessWindow.mainView, false);

   var layers = 3;
   var ATWT = [
      ATrousWaveletTransformGaussian5(layers),
      ATrousWaveletTransformGaussian7(layers),
      ATrousWaveletTransformGaussian9(layers),
      ATrousWaveletTransformGaussian11(layers)
   ];

   var largeViewIds = [];
   var smallViewIds = [];
   var largeWindows = [];
   var smallWindows = [];

   for (var i = 0; i < ATWT.length; i++) {
      // clone the source image
      var largeWindow = cloneView(starlessWindow.mainView, format("_%s_layers%d_R_large", sourceView.id, layers));
      var smallWindow = cloneView(starlessWindow.mainView, format("_%s_layers%d_small", sourceView.id, layers));

      // show large
      largeWindow.show();
      // transform
      ATWT[i].executeOn(largeWindow.mainView, false);

      // create corresponding "small" scale image
      smallWindow.show();
      var PMsmall = new PixelMath;
      PMsmall.expression = format("%s - %s", sourceView.id, largeWindow.mainView.id);
      PMsmall.executeOn(smallWindow.mainView, false);

      largeViewIds.push(largeWindow.mainView.id);
      smallViewIds.push(smallWindow.mainView.id);
      largeWindows.push(largeWindow);
      smallWindows.push(smallWindow);
   }

   layers=4;
   for (var i = 0; i < ATWT.length; i++) {
      // clone the source image
      var largeWindow = cloneView(starlessWindow.mainView, format("_%s_layers%d_R_large", sourceView.id, layers));
      var smallWindow = cloneView(starlessWindow.mainView, format("_%s_layers%d_small", sourceView.id, layers));

      // show large
      largeWindow.show();
      // transform
      ATWT[i].executeOn(largeWindow.mainView, false);

      // create corresponding "small" scale image
      smallWindow.show();
      var PMsmall = new PixelMath;
      PMsmall.expression = format("%s - %s", sourceView.id, largeWindow.mainView.id);
      PMsmall.executeOn(smallWindow.mainView, false);

      largeViewIds.push(largeWindow.mainView.id);
      smallViewIds.push(smallWindow.mainView.id);
      largeWindows.push(largeWindow);
      smallWindows.push(smallWindow);
   }

   // finally, create the final image
   var largeWindow = cloneView(starlessWindow.mainView, format("%s_large", sourceView.id));
   largeWindow.show();
   var smallWindow = cloneView(starlessWindow.mainView, format("%s_small", sourceView.id));
   smallWindow.show();
   var PMfinal = new PixelMath;
   PMfinal.expression = largeViewIds.join("+");
   PMfinal.rescale = true;
   PMfinal.executeOn(largeWindow.mainView, false);
   PMfinal.expression = smallViewIds.join("+");
   PMfinal.executeOn(smallWindow.mainView, false);

   // repair stars
   smallWindow.mask = starrepairWindow;
   smallWindow.maskEnabled = true;
   smallWindow.maskVisible = false;
   smallWindow.maskInverted = true;
   var CON = new Convolution;
   CON.sigma = 1.00;
   CON.executeOn(smallWindow.mainView); // keep history
   smallWindow.maskEnabled = false;

   // close the temporary windows
   starlessWindow.forceClose();
   starmaskWindow.forceClose();
   starrepairWindow.forceClose();
   for (var x = 0; x < largeWindows.length; x++) {
      largeWindows[x].forceClose();
      smallWindows[x].forceClose();
   }
}

main();
