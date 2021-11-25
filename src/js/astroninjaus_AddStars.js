#feature-id  astroninja.us > Add Stars

#define ID                 "AddStars"
#define TITLE              "Add Stars"
#define VERSION            "0.0.1"
#define AUTHOR             "Naveen Malik"

#feature-info adds image "$T_stars" into active view


function mainAddStars() {
    // auto stretches the current active view using ez scripts
    var window = ImageWindow.activeWindow;
    if ( !window )
    {
       (new MessageBox( "There is no active image window!",
                        TITLE, StdIcon_Error, StdButton_Ok )).execute();
       return;
    }

	Console.show();
	Console.writeln("Adding stars back into image, assumes extracted by StarXTerminator...")
 
	var PM = new PixelMath;
	PM.expression = format("%s + %s_stars", window.currentView.id, window.currentView.id)
	PM.executeOn(window.currentView)

	Console.hide();
}

mainAddStars();

