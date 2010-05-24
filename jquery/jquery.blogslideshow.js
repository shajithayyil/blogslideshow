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
 * Variation of asynchronous queue, which iterates given callback specified number of times
 */
var aQueue = {
    iterator : 0,
    timer : null,
    options : {},
    chain : [],
    /**
     * Add an asynchronous iterator intothe queue, which will call 'iteratedCallback' of
     * 'iterations' times and then call 'completedCallback'
     * The method is chainable
     * @param object options {
     *      function options.startedCallback
     *      function options.iteratedCallback
     *      function options.completedCallback
     *      int options.iterations - number of iterations
     *      int options.delay - delay in msec
     *      boolean options.reverse - when reverse is true, decrementing, otherwise incrementing
     *      object options.scope - context of use
     * }
     * @return object aQueue
     */
    add : function(options) {
        aQueue.chain.push(options);
        return aQueue;
    },
    /**
     * Run the queue
     * @return void
     */
    run : function() {
        if (aQueue.chain.length) {
            var options = aQueue.chain.shift();
            aQueue.options = options;
            if (undefined !== options.startedCallback) {
                options.startedCallback(options.scope); // I decided started event handler should
            }                                           // be here for the sake of unified interface
            if (undefined === options.iterations) {
                return;
            }
            aQueue.iterator = 0;
            if (undefined !== options.reverse) {
                aQueue.iterator = options.iterations + 1;
                aQueue.deiterate();
            } else {
                aQueue.iterate();
            }
        }
    },
    /**
     * Iterates iteratedCallback till the number of iterations approaches iterations
     * @return void
     */
    iterate : function() {
        if (++aQueue.iterator <= aQueue.options.iterations) {
            aQueue.options.iteratedCallback(aQueue.iterator, aQueue.options.iterations
                , aQueue.options.scope);
            aQueue.timer = setTimeout(aQueue.iterate, aQueue.options.delay);
        } else {
            aQueue.options.completedCallback(aQueue.options.scope);
            aQueue.timer = null;
            aQueue.run();
        }
    },
    /**
     * Deiterates iteratedCallback
     * @return void
     */
    deiterate : function() {
        if (--aQueue.iterator >= 1) {
            aQueue.options.iteratedCallback(aQueue.iterator, aQueue.options.iterations
                , aQueue.options.scope);
            aQueue.timer = setTimeout(aQueue.deiterate, aQueue.options.delay);
        } else {
            aQueue.options.completedCallback(aQueue.options.scope);
            aQueue.timer = null;
            aQueue.run();
        }
    },
    /**
     * Cancel the queue
     */
    stop : function() {
        aQueue.timer = null;
        aQueue.iterator = aQueue.options.reverse ? 0 : aQueue.options.iterations + 1;
        aQueue.chain = [];
    }
}
/**
 * Show effect callbacks
 */
var effect = {
        /**
         * Opacity style setter
         * @param HTMLNode node
         * @param string value
         */
        opacity : function(node, value) {
            node.css('filter', 'alpha(opacity:' + value + ')');
            node.css('opacity', value / 100);
        },
        /**
         * Transformation style setter
         * @param HTMLNode node
         * @param string value
         */
        transform : function(node, value) {
              node.css('-moz-transform', value);
              node.css('-webkit-transform', value);
        },
        /**
         * Align node to the screen center. When donor specified the node is aligned
         * according to donor size
         * @param HTMLNode node
         * @param HTMLNode donor OPTIONAL
         */
        centerBy : function(node, donor) {
             if (undefined === donor) {
                 donor = node;
             }
             node.css('left',
                Math.ceil(document.body.scrollLeft + $(window).width()/2 - donor.width()/2) + "px"
             );
             node.css('top',
                Math.ceil(document.body.scrollTop + $(window).height()/2 - donor.height()/2) + "px"
             );
        },
        /**
         * Makes node size the same as donor
         * @param HTMLNode node
         * @param HTMLNode donor
         */
        sizeBy : function(node, donor) {
            node.css('width', donor.width() + 'px');
            node.css('height', donor.height() + 'px');
        },
        /**
         * Makes node position the same as donor
         * @param HTMLNode node
         * @param HTMLNode donor
         */
        positionBy : function(node, donor) {
            node.css('top', donor.css('top'));
            node.css('left', donor.css('left'));
        },
        /**
         * Fade effect
         */
        _fadeStarted : function(scope) {
            scope.spriteNode.removeClass('hidden');
            effect.opacity(scope.spriteNode, 0);
            scope.spriteNode.attr('src', scope.active);
            effect.centerBy(scope.spriteNode);
        },
        _fadeIterated : function(counter, number, scope) {
            effect.opacity(scope.spriteNode, counter * number * 10);
        },
        _fadeCompleted : function(scope) {
            scope.imageNode.attr('src', scope.active);
            effect.opacity(scope.spriteNode, 100);
            effect.centerBy(scope.boundingBox, scope.imageNode);
            scope.spriteNode.addClass('hidden');
        },
       /**
         * Jalousie effect
         */
        _jalousieStarted : function(scope) {
            scope.spriteNode.attr('src', scope.active);
            effect.sizeBy(scope.eOverlayNode, scope.spriteNode);
            effect.centerBy(scope.eOverlayNode, scope.spriteNode);
            scope.eOverlayNode.removeClass('hidden');
            var maxW = scope.spriteNode.width();
            scope.eOverlayNode.children().each($.proxy(function(i, node){
                $(node).css('backgroundImage', 'url(' + scope.active + ')');
                $(node).css('backgroundPosition', '-' + Math.ceil(i * maxW / 10) + 'px 0px');
                effect.transform($(node), 'scale(0.1, 1)');
            }, this));
        },
        _jalousieIterated : function(counter, number, scope) {
            scope.eOverlayNode.children().each($.proxy(function(i, node){
                effect.transform($(node), 'scale(' + (counter / number) + ', 1)');
            }, this));
            effect.opacity(scope.imageNode, (number - counter) * number * 10);
        },
        _jalousieCompleted : function(scope) {
            scope.imageNode.attr('src', scope.active);
            effect.opacity(scope.imageNode, 100);
            effect.positionBy(scope.boundingBox, scope.eOverlayNode);
            scope.eOverlayNode.addClass('hidden');
        },
        /**
         * Ladder effect
         */
        _ladderStarted : function(scope) {
            scope.boundingBox.css('background',
                'url(' + scope.imageNode.src + ') center center no-repeat');
            scope.spriteNode.attr('src', scope.active);
            effect.centerBy(scope.boundingBox, scope.spriteNode);
            effect.sizeBy(scope.boundingBox, scope.spriteNode);
            scope.imageNode.attr('src', "");
            effect.sizeBy(scope.eOverlayNode, scope.spriteNode);
            effect.centerBy(scope.eOverlayNode, scope.spriteNode);
            scope.eOverlayNode.removeClass('hidden');
        },
        _ladderIterated : function(counter, number, scope) {
            var maxH = scope.spriteNode.height();
            var maxW = scope.spriteNode.width();
            scope.eOverlayNode.children().each($.proxy(function(i, node){
                var h = Math.ceil((counter-1) * maxH / number - ( i * maxH / 10));
                if (h > maxH) {
                    h = maxH;
                }
                if (h < 0) {
                    h = 0;
                }
                $(node).css('backgroundImage', 'url(' + scope.active + ')');
                $(node).css('backgroundPosition', '-' + Math.ceil(i*maxW/10) + 'px ' + h + 'px');
            }, this));
        },
        _ladderCompleted : function(scope) {
            scope.imageNode.attr('src', scope.active);
            effect.positionBy(scope.boundingBox, scope.eOverlayNode);
            scope.eOverlayNode.addClass('hidden');
            scope.boundingBox.css('background', "");
            scope.eOverlayNode.children().each($.proxy(function(i, node){
               $(node).css('background', '');
            }, this));
        },
       /**
        * Scroll left effect
        */
        _scrollStarted : function(scope) {
            scope.boundingBox.css('background',
                'url(' + scope.imageNode.attr('src') + ') center center no-repeat');
            scope.spriteNode.attr('src', scope.active);
            effect.centerBy(scope.boundingBox, scope.spriteNode);
            effect.sizeBy(scope.boundingBox, scope.spriteNode);
            scope.imageNode.attr('src', scope.active);
            scope.imageNode.css('left', scope.spriteNode.width() + 'px');
            scope.boundingBox.css('overflow', 'hidden');
            scope.imageNode.css('position', 'relative');
        },
        _scrollIterated : function(counter, number, scope) {
            scope.imageNode.css('left', Math.ceil((counter - 1)
                * scope.spriteNode.width() / number) + 'px');
        },
        _scrollCompleted : function(scope) {
            scope.imageNode.css('left', "0px");
            scope.boundingBox.css('width', 'auto');
            scope.boundingBox.css('height', 'auto');
            scope.boundingBox.css('overflow', '');
            scope.imageNode.css('position', '');
            scope.boundingBox.css('background', '');
        },
        /**
        * Rotate effect
        */
        _rotateStarted : function(scope) {
            scope.boundingBox.css('background',
                'url(' + scope.imageNode.attr('src') + ') center center no-repeat');
            scope.spriteNode.attr('src', scope.active);
            effect.centerBy(scope.boundingBox, scope.spriteNode);
            effect.sizeBy(scope.boundingBox, scope.spriteNode);
            scope.imageNode.attr('src', scope.active);

        },
        _rotateIterated : function(counter, number, scope) {
            effect.transform(scope.imageNode,
                'rotate(' + (counter * 45) + 'deg) scale('+ (counter / number) +')');
        },
        _rotateCompleted : function(scope) {
            effect.transform(scope.imageNode,'rotate(0deg) scale(1)');
            scope.boundingBox.css('width', 'auto');
            scope.boundingBox.css('height', 'auto');
            scope.boundingBox.css('background', '');
        },
         /**
        * Zoom effect
        */
        _zoomStarted : function(scope) {
            scope.spriteNode.attr('src', scope.active);
        },
        _zoomHalfCompleted : function(scope) {
            effect.centerBy(scope.boundingBox, scope.spriteNode);
            effect.sizeBy(scope.boundingBox, scope.spriteNode);
            scope.imageNode.attr('src', scope.active);
        },
        _zoomIterated : function(counter, number, scope) {
            effect.transform(scope.imageNode, 'scale('+ (counter / number) +')');
        },
        _zoomCompleted : function(scope) {
            scope.boundingBox.css('width', 'auto');
            scope.boundingBox.css('height', 'auto');
            effect.transform(scope.imageNode, 'scale(1)');
        }
};
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
        maskNode : null, // Mask frezzeing the screen
        prevBtnNode : null, // To previous image button
        nextBtnNode : null, // To next image button
        closeBtnNode : null, // Close overlay button
        imageNode : null, // Image object
        spriteNode: null, // Sprite which is used for visual effects
        eOverlayNode: null,
        /**
         * Initializates environment
         */
	init : function(collection) {
            this.cssLoad(this.options.css);
            this._walkThroughA(collection);
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
            effect.centerBy(this.boundingBox, this.imageNode);
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
                            startedCallback: effect._fadeStarted,
                            iteratedCallback: effect._fadeIterated,
                            completedCallback: effect._fadeCompleted,
                            iterations: 3,
                            delay: 100,
                            scope: this}).run();
                        break;
                    case 'jalousie' :
                        aQueue.add({
                            startedCallback: effect._jalousieStarted,
                            iteratedCallback: effect._jalousieIterated,
                            completedCallback: effect._jalousieCompleted,
                            iterations: 5,
                            delay: 50,
                            scope: this}).run();
                        break;
                    case 'ladder' :
                        aQueue.add({
                            startedCallback: effect._ladderStarted,
                            iteratedCallback: effect._ladderIterated,
                            completedCallback: effect._ladderCompleted,
                            iterations: 20,
                            delay: 50,
                            reverse: true,
                            scope: this}).run();
                        break;
                    case 'scroll' :
                        aQueue.add({
                            startedCallback: effect._scrollStarted,
                            iteratedCallback: effect._scrollIterated,
                            completedCallback: effect._scrollCompleted,
                            iterations: 5,
                            delay: 150,
                            reverse: true,
                            scope: this}).run();
                        break;
                     case 'rotate' :
                        aQueue.add({
                            startedCallback: effect._rotateStarted,
                            iteratedCallback: effect._rotateIterated,
                            completedCallback: effect._rotateCompleted,
                            iterations: 10,
                            delay: 50,
                            scope: this}).run();
                        break;
                    case 'zoom' :
                        aQueue.add({
                            startedCallback: effect._zoomStarted,
                            iteratedCallback: effect._zoomIterated,
                            completedCallback: effect._zoomHalfCompleted,
                            iterations: 5,
                            delay: 50,
                            scope: this,
                            reverse : true}).add({
                            iteratedCallback: effect._zoomIterated,
                            completedCallback: effect._zoomCompleted,
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
            e.data.maskNode.remove();
            e.data.boundingBox.remove();
            e.data.spriteNode.remove();
            e.data.eOverlayNode.remove();
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

            this.maskNode.die('click').live('click', this, this._onClickClose);

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

            this.maskNode = $('body #ss-mask');
            this.boundingBox = $('body #ss-window');
            this.toolbarNode = $('body #ss-window #ss-toolbar');
            this.prevBtnNode = $('body #ss-window #ss-prev');
            this.nextBtnNode = $('body #ss-window #ss-next');
            this.closeBtnNode = $('body #ss-window #ss-close');
            this.imageNode = $('body #ss-window #ss-image');
            this.spriteNode = $('body #ss-sprite');
            this.eOverlayNode = $('body #ss-effect-overlay');
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