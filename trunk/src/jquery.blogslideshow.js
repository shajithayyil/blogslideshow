/*
* Blog Slide Show
*
* @package blogslideshow
* @author Dmitry Sheiko
* @version $Revision$
* @license GNU
* @copyright (c) Dmitry Sheiko http://dsheiko.com
* @projectDescription A fancy image viewer, that supports many different types of transition
*                     effects including CSS3/HTML5-related.
* @id $.fn.bsShow
* @param {effect : string, css: string } - effect can be one of following fade, scroll, ladder,
*                                          jalousie, rotate, zoom, null
*                                          css [OPTIONAL] - stylesheet filename
* @return void
*
* Dependencies:
*   tEffect (t-effect.js)
*   aQueue (a-queue.js)
*
* Project page: http://blogslideshow.googlecode.com/
* Usage examples:
* $(document).ready(function(){
*     $('a[rel=blogslideshow]').bsShow({
*         effect: 'fade'
*     });
* });
*
*
* Compatibility:
*	Tested with Google Chrome 4.1, Firefox 3.6.3, Opera 10.10, Apple Safari 4.0.5, IE 8
*	Requires jQuery 1.4+
*
*/


(function( $ ) {

var MIN_WIDTH  = 300,
    MIN_HEIGHT = 300,
    EOVERLAY_TPL = '<div id="ss-effect-overlay" class="hidden">' +
                   '<div></div><div></div><div></div><div></div><div></div>' +
                   '<div></div><div></div><div></div><div></div><div></div>' +
                   '</div>',
    SPRITE_TPL = '<img id="ss-sprite" src="" class="hidden" />',
    MASK_TPL = '<div id="ss-mask"><!-- --></div>';

/**
 * Blog Slide Show Component
 * @param object options - available options:
 *  effect : string
 *  css : string
 */
var bsShow = function(collection, options) {
    $.extend(this.options, options);
    this.init(collection);
    bsShow.instace = this;
}


bsShow.instace = null;

bsShow.prototype = {
        options : {
            'css' : 'blogslideshow.css',
            'effect' : 'fade'
        },
	images : [],
	active : null,
        // Placeholders
        boundingBox : null, // Overlay
        toolbarNode : null, // Toolbar area with navigation buttons
        freezeScreenNode : null, // Mask frezzeing the screen
        prevBtnNode : null, // To previous image button
        nextBtnNode : null, // To next image button
        closeBtnNode : null, // Close overlay button
        imageNode : null, // Image object
        overlayImageNode: null, // Sprite which is used for visual effects
        overlayMaskNode: null,
        /**
         * Initializates environment
         */
	init : function(collection) {
            this.cssLoad(this.options.css);
            this.checkDependencies();
            this.delegateFramework();
            this._walkThroughA(collection);
	},
        /**
         * Object property getter (for compliance with YUI3)
         * @param (string) property
         * @return (mixed)
         */
        get : function(property) {
            return this[property];
        },
        /**
         * Object property setter (for compliance with YUI3)
         * @param (string) property
         * @param (mixed) value
         */
        set : function(property, value) {
            this[property] = value;
        },
        /**
         * Checks if whether dependencies are loaded
         */
        checkDependencies : function() {
            if (undefined == tEffect) {
                throw "Cannot find dependency - Transiton Effect library";
            }
            if (undefined == aQueue) {
                throw "Cannot find dependency - Asynchronous Queue library";
            }
        },
        /**
         * Delegate DOM manipulation function of the framework to Transition Effect library
         */
        delegateFramework : function() {
            tEffect.Util().delegate({
                isIe: function(){
                    return $.browser.msie;
                },
                setStyle : function(node, property, value) {
                    $(node).css(property, value);
                },
                getStyle : function(node, property) {
                    return $(node).css(property).replace(/px$/, "");
                },
                transform : function(node, value) {
                   $(node).css('-moz-transform', value);
                   $(node).css('-webkit-transform', value);
                },
                windowWidth : function() {
                    return $(window).width();
                },
                windowHeight : function() {
                    return $(window).height();
                },
                show : function(node) {
                    node.removeClass('hidden');
                },
                hide : function(node) {
                    node.addClass('hidden');
                },
                set : function(node, property, value) {
                    $(node).attr(property, value);
                },
                get : function(node, property) {
                    return $(node).attr(property);
                },
                eachChild : function(node, callback, scope) {
                    node.children().each($.proxy(function(i, node){
                        callback(i, node, scope);
                    }, this));
                }
             });
        },
        /**
         * Tries to apply shim
         * @return void
         */
        tryShim : function() {
            if ($.fn.bgiframe) {
                this.boundingBox.bgiframe();
            }
        },
        /**
         * Loads given CSS file
         * @return void
         */
        cssLoad : function(file) {
            $('body').append('<link rel="stylesheet" href="'+
                file + '" type="text/css" media="screen" />');
        },
        /**
         * Aligns component to center of the screen
         * @return void
         */
        center : function() {
            if (this.imageNode.width() < MIN_WIDTH) {
                this.imageNode.width(MIN_WIDTH);
            }
            if (this.imageNode.height() < MIN_HEIGHT) {
                this.imageNode.height(MIN_HEIGHT);
            }
            tEffect.Util(this.boundingBox).centerBy(this.imageNode);
        },
        /**
         * Retrieves previous and next links
         * @return void
         */
        getNavigation : function() {
          // Get navigation position
            var i = 0; // actual index
            // Get actual pagination
            for (var j in this.images) {
                if (this.images[j].src == this.active
                    || this.images[j].rel == this.active) {
                    i = j;
                }
            }
            var prevLink = (i > 0 ? this.images[i - 1].src : null);
            var nextLink = (i < (this.images.length - 1) ? this.images[i * 1 + 1].src
                : null);
            return {prev:prevLink, next: nextLink};
        },
        /**
         * Updates slide show component
         * @param string href
         * @return void
         */
        showImage : function(href, init) {
            if (null === href || !href.length) {
                return;
            }
            this.active = href;

            if (this.options.effect && undefined === init)  {
                switch (this.options.effect) {
                    case 'fade' :
                        aQueue.add({
                            startedCallback: tEffect._fadeStarted,
                            iteratedCallback: tEffect._fadeIterated,
                            completedCallback: tEffect._fadeCompleted,
                            iterations: 3,
                            delay: 100,
                            scope: this}).run();
                        break;
                    case 'jalousie' :
                        aQueue.add({
                            startedCallback: tEffect._jalousieStarted,
                            iteratedCallback: tEffect._jalousieIterated,
                            completedCallback: tEffect._jalousieCompleted,
                            iterations: 5,
                            delay: 50,
                            scope: this}).run();
                        break;
                    case 'ladder' :
                        aQueue.add({
                            startedCallback: tEffect._ladderStarted,
                            iteratedCallback: tEffect._ladderIterated,
                            completedCallback: tEffect._ladderCompleted,
                            iterations: 20,
                            delay: 50,
                            reverse: true,
                            scope: this}).run();
                        break;
                    case 'scroll' :
                        aQueue.add({
                            startedCallback: tEffect._scrollStarted,
                            iteratedCallback: tEffect._scrollIterated,
                            completedCallback: tEffect._scrollCompleted,
                            iterations: 5,
                            delay: 150,
                            reverse: true,
                            scope: this}).run();
                        break;
                     case 'rotate' :
                        aQueue.add({
                            startedCallback: tEffect._rotateStarted,
                            iteratedCallback: tEffect._rotateIterated,
                            completedCallback: tEffect._rotateCompleted,
                            iterations: 10,
                            delay: 50,
                            scope: this}).run();
                        break;
                    case 'zoom' :
                        aQueue.add({
                            startedCallback: tEffect._zoomStarted,
                            iteratedCallback: tEffect._zoomIterated,
                            completedCallback: tEffect._zoomHalfCompleted,
                            iterations: 5,
                            delay: 50,
                            scope: this,
                            reverse : true}).add({
                            iteratedCallback: tEffect._zoomIterated,
                            completedCallback: tEffect._zoomCompleted,
                            iterations: 5,
                            delay: 50,
                            scope: this}).run();
                        break;
                }
            } else {
                this.imageNode.attr('src', href);
            }


        },
        /**
         * Event handlers
         * Each handler:
         * @param event e
         * @return void
         */
        _onKeypress : function(e) {
            e.data = this;
            // Escape
            if (27 == e.keyCode) {
                this._onClickClose(e);
            }
            // Next
            if (39 == e.keyCode) {
                this._onClickNext(e);
            }
            // Previous
            if (37 == e.keyCode) {
                this._onClickPrev(e);
            }
        },
        _onClickPrev : function(e) {
            e.preventDefault();
            e.data.timer = null;
            e.data.showImage(e.data.getNavigation().prev);
        },
        _onClickNext : function(e) {
            e.preventDefault();
            e.data.timer = null;
            e.data.showImage(e.data.getNavigation().next);
        },
        _onClickClose : function(e) {
            e.preventDefault();
            e.data.timer = null;
            e.data.freezeScreenNode.remove();
            e.data.boundingBox.remove();
            e.data.overlayImageNode.remove();
            e.data.overlayMaskNode.remove();
        },
        _onMouseOver : function(e) {
            e.data.toolbarNode.removeClass('hidden');
        },
        /**
         * Subscribe event handlers for the slide show component
         * @return void
         */
        bindUI : function() {
            this.prevBtnNode.die('click', this._onClickPrev).live('click', this, this._onClickPrev);
            this.nextBtnNode.die('click', this._onClickNext).live('click', this, this._onClickNext);
            this.closeBtnNode.die('click', this._onClickClose).live('click', this, this._onClickClose);
            $(document).unbind('keydown').bind('keydown', $.proxy(this._onKeypress, this));

            this.freezeScreenNode.die('click').live('click', this, this._onClickClose);

            this.boundingBox.live('mouseover', this, this._onMouseOver);
            this.boundingBox.live('mouseout', this, function(e) {
                e.data.toolbarNode.addClass('hidden');
            });

            if (!this.options.effect) {
                this.imageNode.bind('load', $.proxy(this.center, this));
            }
            $(window).unbind('resize').bind('resize', $.proxy(this.center, this));
        },
        /**
         * Renders HTML for the slide show component
         * @param string href
         * @return void
         */
	renderUI : function(href) {
            if (null === href || !href.length) {
                return;
            }
            var tpl = '<img id="ss-image" src="' + href + '" />' +
                '<div id="ss-toolbar" class="hidden">' +
                '   <div id="ss-prev" class="ss-btn"><!-- --></div>' +
                '   <div id="ss-close" class="ss-btn"><!-- --></div>' +
                '   <div id="ss-next" class="ss-btn"><!-- --></div>' +
                '</div>';

            $('body').append(MASK_TPL);
            $('body').append('<div id="ss-window">' + tpl + '</div>');
            $('body').append(SPRITE_TPL);
            $('body').append(EOVERLAY_TPL);

            this.freezeScreenNode = $('body #ss-mask');
            this.boundingBox = $('body #ss-window');
            this.toolbarNode = $('body #ss-window #ss-toolbar');
            this.prevBtnNode = $('body #ss-window #ss-prev');
            this.nextBtnNode = $('body #ss-window #ss-next');
            this.closeBtnNode = $('body #ss-window #ss-close');
            this.imageNode = $('body #ss-window #ss-image');
            this.overlayImageNode = $('body #ss-sprite');
            this.overlayMaskNode = $('body #ss-effect-overlay');
            this.tryShim(); // shimming will be enaibled when bgiframe loaded
            this.bindUI();
            this.center();
            this.showImage(href, true);
	},
        /**
         * Collect urls of images to be shown
         * E.g. Walks through A elements, looking for those which contains Rel=blogslideshow
         *
         * @param NodeList collection - range of HTML element to scan against image links occurances
         * @return void
         */
	_walkThroughA : function(collection) {
            var i = 0;
            // Assigns onclick event for found links
            collection.live('click', this, function(e){
                if ($(this).attr('href')) {
                    e.preventDefault();
                    e.data.renderUI($(this).attr('href'));
                }
            });
            var context = this;
            collection.each(function() {
                 if ($(this).attr('href')) {
                    // Storages required info
                    context.images[i] = new Image();
                    context.images[i].src = $(this).attr('href');
                    context.images[i].rel = $(this).attr('href');
                    i++;
                 }
            });
	}
};
$.fn.bsShow = function(options) {
    new bsShow(this, options);
};
$.bsShow = function(options) {
    $.extend(bsShow.instace.options, options);
};
})( jQuery );