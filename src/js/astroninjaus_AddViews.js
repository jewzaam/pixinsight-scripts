#feature-id  astroninja.us > Add Views

#define ID                 "AddViews"
#define TITLE              "Add Views"
#define VERSION            "0.0.1"
#define AUTHOR             "Naveen Malik"

#feature-info adds all "$T[0-9]+" images to the applied image


function mainAddViews() {
    var window = ImageWindow.activeWindow;
    if ( !window )
    {
       (new MessageBox( "There is no active image window!",
                        TITLE, StdIcon_Error, StdButton_Ok )).execute();
       return;
    }

    var baseId = window.currentView.id;

    var PM = new PixelMath;
    //PM.rescale = true;

    var windows = ImageWindow.windows;
    for (var i in windows) {
       if (windows[i].mainView.id.startsWith(baseId) && 
            windows[i].mainView.id != baseId) {
         PM.expression = format("$T + %s", windows[i].mainView.id);
         PM.executeOn(window.currentView)
       }
    }
}

mainAddViews();

