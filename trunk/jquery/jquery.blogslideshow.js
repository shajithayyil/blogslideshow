/*
* Blog Slide Show
*
* @package blogslideshow
* @author $Author: sheiko $
* @version $Id: blogslideshow.js, v 1.0 $
* @license GNU
* @copyright (c) Dmitry Sheiko http://www.cmsdevelopment.com
*/


(function( $ ) {

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
         * Fade effect
         */
        _fadeStarted : function(scope) {
            scope.boundingBox.css('background', 'url(' + scope.imageNode.attr('src') + ') no-repeat');
            scope.imageNode.attr('src', scope.active);
        },
        _fadeIterated : function(counter, number, scope) {
            scope.imageNode.css('filter', 'alpha(opacity:' + counter * number * 10 + ')');
            scope.imageNode.css('opacity', '0.' + counter * number);
        },
        _fadeCompleted : function(scope) {
            scope.imageNode.css('filter', 'alpha(opacity:100)');
            scope.imageNode.css('opacity', '1');
            scope.center();
        },
       /**
        * Scroll left effect
        */
        _scrollStarted : function(scope) {
            scope.boundingBox.css('background','url(' + scope.imageNode.attr('src') + ') no-repeat');
            effect.originalWidth = scope.imageNode.attr('width');
            scope.boundingBox.css('width', effect.originalWidth + "px");
            scope.boundingBox.css('height', scope.imageNode.attr('height') + "px");
            scope.imageNode.attr('src', scope.active);
            scope.boundingBox.css('overflow', 'hidden');
            scope.imageNode.css('position', 'relative');
        },
        _scrollIterated : function(counter, number, scope) {
            scope.imageNode.css('left', (4 - counter) * (effect.originalWidth/number) + 'px');
        },
        _scrollCompleted : function(scope) {
            scope.imageNode.css('left', "0px");
            scope.boundingBox.css('width', 'auto');
            scope.boundingBox.css('height', 'auto');
            scope.boundingBox.css('overflow', '');
            scope.imageNode.css('position', '');
            scope.boundingBox.css('background', '');
            scope.center();
        },
        /**
        * Rotate effect
        */
        _rotateStarted : function(scope) {
            scope.boundingBox.css('width', scope.imageNode.attr('width') + "px");
            scope.boundingBox.css('height', scope.imageNode.attr('height') + "px");
            scope.spriteNode.removeClass('hidden');
            scope.spriteNode.attr('src', scope.active);
            scope.spriteNode.attr('width', scope.imageNode.attr('width'));
            scope.spriteNode.attr('height', scope.imageNode.attr('height'));
        },
        _rotateIterated : function(counter, number, scope) {
            var transformation = 'rotate(' + (counter * 45) + 'deg) scale('+ (counter / number) +')';
            scope.spriteNode.css('-moz-transform', transformation);
            scope.spriteNode.css('-webkit-transform', transformation);
        },
        _rotateCompleted : function(scope) {
            scope.spriteNode.addClass('hidden');
            scope.boundingBox.css('width', 'auto');
            scope.boundingBox.css('height', 'auto');
            scope.imageNode.attr('src', scope.active);
            scope.imageNode.unbind('load', scope.center).bind('load', scope.center);
        },
        /**
        * CurtanX effect
        */
        _curtanXStarted : function(scope) {
            effect.originalWidth = scope.imageNode.attr('width');
            effect.originalHeight = scope.imageNode.attr('height');
            scope.boundingBox.css('width', scope.imageNode.attr('width') + "px");
            scope.boundingBox.css('height', scope.imageNode.attr('height') + "px");
            scope.spriteNode.attr('src', scope.imageNode.attr('src'));
            scope.spriteNode.removeClass('hidden');
            scope.imageNode.addClass('hidden');
        },
        _curtanXIterated : function(counter, number, scope) {
            scope.spriteNode.attr('width', Math.ceil(counter * effect.originalWidth / number ));
            scope.spriteNode.attr('height', effect.originalHeight);
        },
        _curtanXHalfCompleted : function(scope) {
            scope.spriteNode.attr('src', scope.active);
        },
        _curtanXCompleted : function(scope) {
            scope.spriteNode.addClass('hidden');
            scope.imageNode.removeClass('hidden');
            scope.boundingBox.css('width', 'auto');
            scope.boundingBox.css('height', 'auto');
            scope.imageNode.attr('src', scope.active);
            scope.imageNode.unbind('load', scope.center).bind('load', scope.center);
        },
         /**
        * Zoom effect
        */
        _zoomStarted : function(scope) {
            effect.originalWidth = scope.imageNode.attr('width');
            effect.originalHeight = scope.imageNode.attr('height');
            scope.boundingBox.css('width', scope.imageNode.attr('width') + "px");
            scope.boundingBox.css('height', scope.imageNode.attr('height') + "px");
            scope.spriteNode.attr('src', scope.imageNode.attr('src'));
            scope.spriteNode.removeClass('hidden');
            scope.imageNode.addClass('hidden');
            scope.spriteNode.attr('width', effect.originalWidth);
            scope.spriteNode.attr('height', effect.originalHeight);
        },
        _zoomHalfCompleted : function(scope) {
            scope.spriteNode.attr('src', scope.active);
            scope.spriteNode.attr('width', effect.originalWidth);
            scope.spriteNode.attr('height', effect.originalHeight);
        },
        _zoomIterated : function(counter, number, scope) {
            var transformation = 'scale('+ (counter / number) +')';
            scope.spriteNode.css('-moz-transform', transformation);
            scope.spriteNode.css('-webkit-transform', transformation);
        },
        _zoomCompleted : function(scope) {
            scope.spriteNode.addClass('hidden');
            scope.imageNode.removeClass('hidden');
            scope.boundingBox.css('width', 'auto');
            scope.boundingBox.css('height', 'auto');
            scope.imageNode.attr('src', scope.active);
            scope.imageNode.unbind('load', scope.center).bind('load', scope.center);
        }
};
/**
 * Blog Slide Show Component
 * @param object options - available options:
 *  effect : string
 *  css : string
 */
$.bsShow = function(options) {
    // Reconfigurable Singleton
    if (null !== $.bsShow.instace) {
        $.extend($.bsShow.instace.options, options);
        return;
    }
    $.extend(this.options, options);
    this.bindUI();
    $.bsShow.instace = this;
}


$.bsShow.instace = null;

$.bsShow.prototype = {
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

	bindUI : function() {
            this.cssLoad(this.options.css);
            this._walkThroughA();
	},
        tryShim : function() {
            if ($.fn.bgiframe) {
                this.boundingBox.bgiframe();
            }
        },
        // Load given CSS file
        cssLoad : function(file) {
            $('body').append('<link rel="stylesheet" href="'+
                file + '" type="text/css" media="screen" />');
        },
        center : function() {
            var scope = $.bsShow.instace;
            if (scope.imageNode.width() < 300) {
                scope.imageNode.css('width', '300px');
            }
            if (scope.imageNode.height() < 300) {
                scope.imageNode.css('height', '300px');
            }

            scope.boundingBox.css('left',
                Math.ceil(document.body.scrollLeft + $(window).width()/2
                    - scope.imageNode.width()/2) + "px"
            );
            scope.boundingBox.css('top',
                Math.ceil(document.body.scrollTop + $(window).height()/2
                    - scope.imageNode.height()/2) + "px"
            );
        },
        /**
         * Retrieve previous and next links
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
         * Update slide show overlay
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
                    case 'scroll' :
                        aQueue.add({
                            startedCallback: effect._scrollStarted,
                            iteratedCallback: effect._scrollIterated,
                            completedCallback: effect._scrollCompleted,
                            iterations: 3,
                            delay: 150,
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
                    case 'curtanX' :
                        aQueue.add({
                            startedCallback: effect._curtanXStarted,
                            iteratedCallback: effect._curtanXIterated,
                            completedCallback: effect._curtanXHalfCompleted,
                            iterations: 5,
                            delay: 150,
                            scope: this,
                            reverse : true}).add({
                            iteratedCallback: effect._curtanXIterated,
                            completedCallback: effect._curtanXCompleted,
                            iterations: 5,
                            delay: 150,
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

            this.prevBtnNode.die('click', this._onClickPrev).live('click', this, this._onClickPrev);
            this.nextBtnNode.die('click', this._onClickNext).live('click', this, this._onClickNext);
            this.closeBtnNode.die('click', this._onClickClose).live('click', this, this._onClickClose);
            $(document).unbind('keydown').bind('keydown', this._onKeypress);
        },
        _onKeypress : function(e) {
            // Next
            if (39 == e.keyCode) {
                bsShow.instace._onClickNext(e);
            }
            // Previous
            if (37 == e.keyCode) {
                bsShow.instace._onClickPrev(e);
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
        },
        /**
         * Starts the slide show
         */
	start : function(href) {
            if (null === href || !href.length) {
                return;
            }
            var tpl = '<img id="ss-sprite" class="hidden" src="" />' +
                '<img id="ss-image" src="' + href + '" />' +
                '<div id="ss-toolbar" class="hidden">' +
                '   <div id="ss-prev" class="ss-btn"><!-- --></div>' +
                '   <div id="ss-close" class="ss-btn"><!-- --></div>' +
                '   <div id="ss-next" class="ss-btn"><!-- --></div>' +
                '</div>';

            $('body').append('<div id="ss-mask"></div>');
            $('body').append('<div id="ss-window">' + tpl + '</div>');

            this.maskNode = $('body #ss-mask');
            this.boundingBox = $('body #ss-window');
            this.toolbarNode = $('body #ss-window #ss-toolbar');
            this.prevBtnNode = $('body #ss-window #ss-prev');
            this.nextBtnNode = $('body #ss-window #ss-next');
            this.closeBtnNode = $('body #ss-window #ss-close');
            this.imageNode = $('body #ss-window #ss-image');
            this.spriteNode = $('body #ss-window #ss-sprite');

            this.tryShim(); // shimming will be enaibled when bgiframe loaded

            this.maskNode.die('click').live('click', this, this._onClickClose);

            this.boundingBox.live('mouseover', this, this._onMouseOver);
            this.boundingBox.live('mouseout', this, function(e) {
                e.data.toolbarNode.addClass('hidden');
            });

            if (!this.options.effect) {
                this.imageNode.bind('load', function() {
                    $.bsShow.instace.center();
                });
            }
            $(window).unbind('resize').bind('resize', function(e) {
                $.bsShow.instace.center();
            });

            this.center();
            this.showImage(href, true);
	},
        _onMouseOver : function(e) {
            var scope = $.bsShow.instace;
            if (null === aQueue.timer) {
                scope.toolbarNode.removeClass('hidden');
                scope.oTimer = null;
            } else {
                scope.oTimer = setTimeout(scope._onMouseOver, 400);
            }
        },
        /**
         * Walks through A elements, looking for those which contains Rel=blogslideshow
         * Collect urls of images to be shown
         */
	_walkThroughA : function() {
            var i = 0;
            // Assigns onclick event for found links
            $('a[rel=blogslideshow]').live('click', this, function(e){
                if ($(this).attr('href')) {
                    e.preventDefault();
                    e.data.start($(this).attr('href'));
                }
            });
            var context = this;
            $('a[rel=blogslideshow]').each(function() {
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

})( jQuery );