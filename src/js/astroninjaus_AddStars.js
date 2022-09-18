#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>

#feature-id  astroninja.us > Add Stars

#define ID                 "AddStars"
#define TITLE              "Add Stars"
#define VERSION            "0.0.1"
#define AUTHOR             "Naveen Malik"

#feature-info adds image "$T_stars" into active view

#include "astroninjaus_Common.js"

function mainAddStars() {
    // auto stretches the current active view using ez scripts
    var window = ImageWindow.activeWindow;
    if ( !window ) {
        (new MessageBox("There is no active image window!",
                        TITLE, StdIcon_Error, StdButton_Ok )).execute();
        return;
    }

    var remove_mask = false;

    if (window.maskEnabled && !window.mask.isNull)  {
        var q = new MessageBox("Window has an active mask.  Temporarily remove the mask?",
            "Warning", StdIcon_Question,
            StdButton_No, StdButton_Yes);
        if (q.execute() == StdButton_Yes) {
            remove_mask = true
        }
    }

    var linearize = false;

    var q = new MessageBox("Do you want to linearize images when combining stars?",
        "Warning", StdIcon_Question,
        StdButton_No, StdButton_Yes);
    if (q.execute() == StdButton_Yes) {
        linearize = true
    }

	Console.show();
	Console.writeln("Adding stars back into image.")

    var stars
    var starsViewId = ""
    var starsViewIdSearch = format("%s_stars", window.currentView.id)
    
    // try to find exact match
    Console.writeln("Trying: exact match")
    var allWindows = ImageWindow.windows;
    for (var i in allWindows) {
        if (allWindows[i].mainView.id == starsViewIdSearch) {
            // found exact match.
            stars = allWindows[i]
            starsViewId = allWindows[i].mainView.id
            Console.writeln(format("Exact view match found: %s", starsViewId))
            break
        }
    }

    if (starsViewId == "") {
        // did not find exact match. try to find a partial match.
        // if more than one is found we cannot proceed
        Console.writeln("Trying: partial match")
        found_count = 0
        for (var i in allWindows) {
            if (allWindows[i].mainView.id.contains(starsViewIdSearch)) {
                // found partial match.
                stars = allWindows[i]
                starsViewId = allWindows[i].mainView.id
                found_count++
            }
        }
        if (found_count == 1) {
            Console.writeln(format("Single view partial match found: %s", starsViewId))
        } else if (found_count > 1) {
            Console.warningln("Multiple partial matches found, cannot proceed!")
            stars = null
            starsViewId = ""
            for (var i in allWindows) {
                if (allWindows[i].mainView.id.contains(starsViewIdSearch)) {
                    Console.warningln(format("    %s", allWindows[i].mainView.id))
                }
            }
        }
    }

    if (starsViewId == "" && starsViewIdSearch.contains("_clone")) {
        // didn't find exact or partial match, but it's a clone.
        // try without _clone
        // if more than one is found we cannot proceed
        starsViewIdSearch = starsViewIdSearch.replace("_clone", "")
        Console.writeln("Trying: partial match excluding '_clone' " + starsViewIdSearch)
        found_count = 0
        for (var i in allWindows) {
            if (allWindows[i].mainView.id.contains(starsViewIdSearch)) {
                // found partial match.
                stars = allWindows[i]
                starsViewId = allWindows[i].mainView.id
                found_count++
            }
        }
        if (found_count == 1) {
            Console.writeln(format("Single view partial match found: %s", starsViewId))
        } else if (found_count > 1) {
            Console.warningln("Multiple partial matches found, cannot proceed!")
            stars = null
            starsViewId = ""
            for (var i in allWindows) {
                if (allWindows[i].mainView.id.contains(starsViewIdSearch)) {
                    Console.warningln(format("    %s", allWindows[i].mainView.id))
                }
            }
        }
    }


    if (starsViewId == "") {
        Console.warningln("No matches found, cannot proceed!")
        stars = null
        starsViewId = ""
    } else if (starsViewId != "") {
        var old_mask = window.maskEnabled;

        // get the _stars window
        var _stars = cloneView(stars.mainView, format("__%s", stars.mainView.id))

        if (remove_mask) {
            window.maskEnabled = false
        }

        if (linearize) {
            window.maskEnabled = false
            var P = new HistogramTransformation;
            P.H = [ // c0, m, c1, r0, r1
               [0.00000000, 0.50000000, 1.00000000, 0.00000000, 1.00000000],
               [0.00000000, 0.50000000, 1.00000000, 0.00000000, 1.00000000],
               [0.00000000, 0.50000000, 1.00000000, 0.00000000, 1.00000000],
               [0.00000000, 0.99900000, 1.00000000, 0.00000000, 1.00000000],
               [0.00000000, 0.50000000, 1.00000000, 0.00000000, 1.00000000]
            ];
            P.executeOn(window.currentView)
            P.executeOn(_stars.mainView)
            if (!remove_mask) {
                window.maskEnabled = old_mask
            }
        }

        var PM = new PixelMath;
        PM.expression = format("%s + %s", window.currentView.id, _stars.mainView.id)
        PM.executeOn(window.currentView)

        if (linearize) {
            window.maskEnabled = false
            var P = new HistogramTransformation;
            P.H = [ // c0, m, c1, r0, r1
               [0.00000000, 0.50000000, 1.00000000, 0.00000000, 1.00000000],
               [0.00000000, 0.50000000, 1.00000000, 0.00000000, 1.00000000],
               [0.00000000, 0.50000000, 1.00000000, 0.00000000, 1.00000000],
               [0.00000000, 0.00100000, 1.00000000, 0.00000000, 1.00000000],
               [0.00000000, 0.50000000, 1.00000000, 0.00000000, 1.00000000]
            ];
            P.executeOn(window.currentView)
            if (!remove_mask) {
                window.maskEnabled = old_mask
            }
        }

        _stars.forceClose()

        if (remove_mask) {
            window.maskEnabled = old_mask
        }

        Console.hide();
    }
}

mainAddStars();

