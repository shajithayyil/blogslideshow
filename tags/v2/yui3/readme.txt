Blog Slide Show YUI3 Port

===================

Version 2.1 - May 2010

---------------------------
Copyright (C) 2008 - 2010 Dmitry Sheiko

Tested under following browsers:
    Google Chrome 4.1
    Firefox 3.6.3
    Opera 10.10
    Apple Safari 4.0.5
    IE 8


BlogSlideShow is a YUI3 module that enhances your blog pages with fancy image viewer, which
provides nice transition effects including CSS3/HTML5-related ones.

All what you need is to provide links on your images, you want to show. Likely you already have
images on blog pages linked. Just add rel attribute containing "blogslideshow" to them.

When you click on such a link, you'll get the image viewer on the overlay. When hovering the
overlay you get toolbar appeared by which you can navigate images. Besides, you can use
keyboard arrows <-, ->, Esc as well.

Features
    * Unique transition effects
    * Easy to setup
    * Progressive enhancement
    * Navigation box
    * Lightweight (~13KB)
    * Linking images
    * Free to use under GPL licence
    * Fully customizable using CSS
    * In 3 ports (pure JS, jQuery, YUI3)
    * Also nice with images of different size


GPL 3 license implies that you must make your further solutions based on BlogSlideShow available
under the GPL, and source code of BlogSlideShow available to download in your site.
A link to http://dsheiko.com is enough.


FILES:

index.html - sample HTML page
*.jpg - sample images
ss_toolbar.png - toolbar
yui3.blogslideshow.js - JS library
blogslideshow.css - stylesheet


HOW TO INSTALL

Just add the HTML page or yours following code:

<script src="http://yui.yahooapis.com/3.1.1/build/yui/yui-min.js"></script>
<script type="text/javascript">
<!--
YUI({
    modules: {
        bsShow: {
           fullpath: 'yui3.blogslideshow.js'
        },
        bsShowCss: {
           fullpath: 'blogslideshow.css',
           type: 'css'
        }
    }
}).use('bsShow', 'bsShowCss', 'widget', 'widget-stack', 'event', 'async-queue', function(Y){
    Y.namespace('app').bsShow.start({
        effect : 'fade'
    });
});
// -->
</script>


JS

Arguments

   1. options - (object) The options below.

Options

    * effect - (string) which transition effect to apply.

Effects

    * fade
    * scroll
    * ladder
    * jalousie
    * rotate
    * zoom
    * null 

HTML

And supply with rel="blogslideshow" all the links to images you want to show through
Blog Slide Show like that:
<a href="sample_wiesbaden.jpg" rel="blogslideshow">link</a>

Yours sincerely,
Dmitry Sheiko,
http://www.dsheiko.com
