#feature-id  astroninja.us > Filter Identifier

#define ID                 "FilterIdentifier"
#define TITLE              "Filter Identifier"
#define VERSION            "0.0.1"
#define AUTHOR             "Naveen Malik"

#feature-info rename view to FILTER FITS header value

function getKeyValue(window, keyName)
{
   for (var i in window.keywords)
   {
      with (window.keywords[i])
      {
         if (name == keyName)
         {
            return value;
         }
      }
   }
   return null;
}

function mainFilterIdentifier() {
    var window = ImageWindow.activeWindow;
    if ( !window )
    {
       (new MessageBox( "There is no active image window!",
                        TITLE, StdIcon_Error, StdButton_Ok )).execute();
       return;
    }

    var oldId = window.currentView.id;

    // get filter name
    var filter = getKeyValue(window, 'FILTER');

    // it will have single quotes around it, strip those
    filter = filter.substring(1, filter.length - 1);

    if (!filter) {
        (new MessageBox( "There is no 'FILTER' keyword on the image!",
                         TITLE, StdIcon_Error, StdButton_Ok )).execute();
        return;
    }

   // get number of exposures from HISTORY
   var exposure_count = "";
   var COMMENT = "ImageIntegration.numberOfImages: ";
   var i = 0
   while (i < window.keywords.length) {
      var k = window.keywords[i];
      if (k.name == "HISTORY") {
         if (k.comment.substring(0, COMMENT.length) == COMMENT) {
            exposure_count = k.comment.substring(COMMENT.length, k.comment.length);
         }
      }
      i++;
   }

   window.currentView.id = format("%s_XXXs_x%s", filter, exposure_count);

   Console.writeln(format("Renamed '%s' to '%s'!", oldId, window.currentView.id))
}

mainFilterIdentifier();

