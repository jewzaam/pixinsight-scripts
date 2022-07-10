#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>
#include "astroninjaus_Common.js"

#feature-id  astroninja.us > Add Views

#define ID                 "AddViews"
#define TITLE              "Add Views"
#define VERSION            "0.1.1"
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

   var windows = ImageWindow.windows;

   // create the output view
   var outputWindow = cloneView(windows[0].mainView, output_view_name);
   var PM = new PixelMath;
	PM.expression = "0"
	PM.executeOn(outputWindow.mainView)
   outputWindow.show();

   for (var i in windows) {
      var x = windows[i].mainView.id.search(input_view_match)
      if (x >= 0) {
         PM.expression = format("$T + %s", windows[i].mainView.id)
         PM.executeOn(outputWindow.mainView)
         windows[i].forceClose()
      }
   }
}

mainAddViews();

