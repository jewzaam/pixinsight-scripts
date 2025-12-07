#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>
#include "astroninjaus_Common.js"

#feature-id  astroninja.us > Add Views

#define ID                 "AddViews"
#define TITLE              "Add Views"
#define VERSION            "0.1.2"
#define AUTHOR             "Naveen Malik"

#feature-info adds all images matching the given input regex

function mainAddViews() {
   if (!Parameters.has("input_view_match")) {
      (new MessageBox( "No 'input_view_match' parameter provided.",
         TITLE, StdIcon_Error, StdButton_Ok )).execute();
      return;
   }
   if (!Parameters.has("output_view_name")) {
      (new MessageBox( "No 'output_view_name' parameter provided.",
         TITLE, StdIcon_Error, StdButton_Ok )).execute();
      return;
   }

   var input_view_match = Parameters.getString("input_view_match");
   var output_view_name = Parameters.getString("output_view_name");

   // Step 1: Find all views that match the pattern - collect view IDs
   var windows = ImageWindow.windows;
   var matchingViewIds = [];
   var matchingWindows = [];
   for (var i in windows) {
      var viewId = windows[i].currentView.id;
      var x = viewId.search(input_view_match);
      if (x >= 0) {
         matchingViewIds.push(viewId);
         matchingWindows.push(windows[i]);
      }
   }

   // only proceed if at least 1 input view exists
   if (matchingViewIds.length === 0) {
      return;
   }

   // Step 2: Identify if the active view is in the list to be merged
   var activeViewId = null;
   var activeViewInList = false;
   try {
      if (ImageWindow.activeWindow) {
         activeViewId = ImageWindow.activeWindow.currentView.id;
         for (var i in matchingViewIds) {
            if (matchingViewIds[i] === activeViewId) {
               activeViewInList = true;
               break;
            }
         }
      }
   } catch (e) {
      // no active window
   }

   var outputWindow = null;
   var mergeList = [];

   // Step 3: If active view IS in the list, set output to active view and remove it from merge list
   if (activeViewInList) {
      outputWindow = ImageWindow.activeWindow;
      outputWindow.currentView.id = output_view_name;
      // Remove active view from merge list
      for (var i in matchingViewIds) {
         if (matchingViewIds[i] !== activeViewId) {
            mergeList.push(matchingViewIds[i]);
         }
      }
   } else {
      // Step 4: ELSE create new output view
      outputWindow = cloneView(matchingWindows[0].currentView, output_view_name);
      outputWindow.show();
      var PM = new PixelMath;
      PM.expression = "0";
      PM.executeOn(outputWindow.currentView);
      // All matching views go into merge list
      mergeList = matchingViewIds.slice(); // copy the array
   }

   // Step 5: Merge the merge list into output view
   var PM = new PixelMath;
   for (var i in mergeList) {
      PM.expression = format("$T + %s", mergeList[i]);
      PM.executeOn(outputWindow.currentView);
   }

   // Step 6: Close merge list
   for (var i in mergeList) {
      try {
         var windows = ImageWindow.windows;
         for (var j in windows) {
            if (windows[j].currentView.id === mergeList[i]) {
               windows[j].forceClose();
               break;
            }
         }
      } catch (e) {
         // window may have been closed already, skip it
         continue;
      }
   }
}

mainAddViews();

