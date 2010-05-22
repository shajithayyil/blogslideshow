Blog Slide Show

===================

Version 2.0 - May 2010

---------------------------
Copyright (C) 2008 - 2010 Dmitry Sheiko

Tested under following browsers:
    Google Chrome 4.1
    Firefox 3.6.3
    Opera 10.10
    Apple Safari 4.0.5
    IE 8


BlogSlideShow is a tiny JS component, which implements a fancy image viewer, that
supports many different types of transition effects including CSS3/HTML5-related.
All what you need is to provide links on your images, you want to show, with
rel attribute containing Url of image file. When you click on such a link, you’ll
get the image view on the overlay. When hovering the overlay you get toolbar appeared
by which you can navigate images. Besides, you can use keyboard arrows <-, -> as well.


GPL 3 license implies that you must make your further solutions based on BlogSlideShow available
under the GPL, and source code of BlogSlideShow available to download in your site. 
A link to http://dsheiko.com is enough.

FILES:

index.html - sample HTML page
*.jpg - sample images
ss_toolbar.png - toolbar
blogslideshow.js - JS library
blogslideshow.css - stylesheet


HOW TO INSTALL

Just add the HTML page or yours following code:

<script src="blogslideshow.js" ></script>
<script type="text/javascript">
<!--
window.onload = function(){
    new bsShow({
        effect: 'fade'
    });
} // -->
</script>


JS 

Arguments

   1. options - (object) The options below. 

Options

    * effect - (string) which transition effect to apply.

Effects

    * fade
    * scroll
    * rotate
    * curtanX
    * zoom
    * null 

HTML

And supply with rel="blogslideshow" all the links to images you want to show through
Blog Slide Show like that:
<a href="sample_wiesbaden.jpg" rel="blogslideshow">link</a>

Yours sincerely,
Dmitry Sheiko,
http://www.dsheiko.com