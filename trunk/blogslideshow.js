/*
* Blog Slide Show
*
* @package blogslideshow
* @author $Author: sheiko $
* @version $Id: blogslideshow.js, v 2.0 $
* @license GNU
* @copyright (c) Dmitry Sheiko http://dsheiko.com
*/

/**
 * Blog Slide Show Component
 * @param object options - available options:
 *  effect : string
 *  css : string
 */
function bsShow(options)
{
    // Reconfigurable Singleton
    if (null !== bsShow.instace) {
        bsShow.instace.merge(options);
        return;
    }
    this.merge(options);
    this.bindUI();
    bsShow.instace = this;
}

(function(bsShow) {

// JS Helpers
// Shortcut for getElementById
var $ = function(divName) {
    return document.getElementById(divName);
}
// Unbind event
$.unbind = function(node, eType, func) {
    if (document.removeEventListener) {
        node.removeEventListener(eType, func, false);
    } else if (document.detachEvent) {
        node.detachEvent('on' + eType, func);
    }
    return node;
};
// Bind event
$.bind = function(node, eType, func) {
    if (document.addEventListener) {
        node.addEventListener(eType, func, false);
    } else if (document.attachEvent) {
        node.attachEvent('on' + eType, func);
    }
    return node;
};
// Load given CSS file
$.cssLoad = function(file) {
    var node = document.createElement("link")
    node.href = file;
    node.rel = "stylesheet";
    node.type = "text/css";
    document.body.appendChild(node);
};
// Append given HTML in the document
$.insert = function(tagName, html, options) {
    var node = document.createElement(tagName);
    if (html.length) {
        node.innerHTML = html;
    }
    if (undefined !== options) {
        for (key in options) {
            node[key] = options[key];
        }

    }
    document.body.appendChild(node);
};
// Get window size
$.viewport = function() {
	var w = 0;
	var h = 0;
	//IE
	if(!window.innerWidth)
	{
            //strict mode
            if(!(document.documentElement.clientWidth == 0)) {
                w = document.documentElement.clientWidth;
                h = document.documentElement.clientHeight;
            }
            //quirks mode
            else {
                if(document.body.clientWidth) {
                    w = document.body.clientWidth;
                    h = document.body.clientHeight;
                } else {
                    w = window.document.body.offsetWidth;
                    h = window.document.body.offsetHeight;
                }
            }
	}
	//w3c
	else {
            w = window.innerWidth;
            h = window.innerHeight;
	}
	return {width:w,height:h};
};

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
            scope.boundingBox.style.background = 'url(' + scope.imageNode.src + ') no-repeat';
            scope.imageNode.src = scope.active;
        },
        _fadeIterated : function(counter, number, scope) {
            if (scope.ie) {
                scope.imageNode.style.filter = 'alpha(opacity:' + counter * number * 10 + ')';
            } else {
                scope.imageNode.style.opacity = '0.' + counter * number;
            }
        },
        _fadeCompleted : function(scope) {
            if (scope.ie) {
                scope.imageNode.style.filter = 'alpha(opacity:100)';
            } else {
                scope.imageNode.style.opacity = '1';
            }
            scope.center();
        },
       /**
        * Scroll left effect
        */
        _scrollStarted : function(scope) {
            scope.boundingBox.style.background = 'url(' + scope.imageNode.src + ') no-repeat';
            effect.originalWidth = scope.imageNode.width;
            scope.boundingBox.style.width = effect.originalWidth + "px";
            scope.boundingBox.style.height = scope.imageNode.height + "px";
            scope.imageNode.src = scope.active;
            scope.boundingBox.style.overflow = 'hidden';
            scope.imageNode.style.position = 'relative';
        },
        _scrollIterated : function(counter, number, scope) {
            scope.imageNode.style.left =  (4 - counter) * (effect.originalWidth/number) + 'px';
        },
        _scrollCompleted : function(scope) {
            scope.imageNode.style.left =  "0px";
            scope.boundingBox.style.width = 'auto';
            scope.boundingBox.style.height = 'auto';
            scope.boundingBox.style.overflow = '';
            scope.imageNode.style.position = '';
            scope.boundingBox.style.background = '';
            scope.center();
        },
        /**
        * Rotate effect
        */
        _rotateStarted : function(scope) {
            scope.boundingBox.style.width = scope.imageNode.width + "px";
            scope.boundingBox.style.height = scope.imageNode.height + "px";
            scope.spriteNode.className = '';
            scope.spriteNode.src = scope.active;
            scope.spriteNode.width = scope.imageNode.width;
            scope.spriteNode.height = scope.imageNode.height;
        },
        _rotateIterated : function(counter, number, scope) {
            var transformation = 'rotate(' + (counter * 45) + 'deg) scale('+ (counter / number) +')';
            scope.spriteNode.style.webkitTransform =  transformation;
            scope.spriteNode.style.MozTransform =  transformation;

        },
        _rotateCompleted : function(scope) {
            scope.spriteNode.className = 'hidden';
            scope.boundingBox.style.width = 'auto';
            scope.boundingBox.style.height = 'auto';
            scope.imageNode.src = scope.active;
            $.unbind(scope.imageNode, 'load', scope.center);
            $.bind(scope.imageNode, 'load', scope.center);
        },
        /**
        * CurtanX effect
        */
        _curtanXStarted : function(scope) {
            effect.originalWidth = scope.imageNode.width;
            effect.originalHeight = scope.imageNode.height;
            scope.spriteNode.src = scope.imageNode.src;
            scope.spriteNode.className = '';
            scope.imageNode.className = 'hidden';
        },
        _curtanXIterated : function(counter, number, scope) {
            scope.spriteNode.width = Math.ceil(counter * effect.originalWidth / number );
            scope.spriteNode.height = effect.originalHeight;
        },
        _curtanXHalfCompleted : function(scope) {
            scope.spriteNode.src = scope.active;
        },
        _curtanXCompleted : function(scope) {
            scope.spriteNode.className = 'hidden';
            scope.imageNode.className = '';
            scope.imageNode.src = scope.active;
            $.unbind(scope.imageNode, 'load', scope.center);
            $.bind(scope.imageNode, 'load', scope.center);
        },
         /**
        * Zoom effect
        */
        _zoomStarted : function(scope) {
            effect.originalWidth = scope.imageNode.width;
            effect.originalHeight = scope.imageNode.height;
            scope.boundingBox.style.width = scope.imageNode.width + "px";
            scope.boundingBox.style.height = scope.imageNode.height + "px";
            scope.spriteNode.src = scope.imageNode.src;
            scope.spriteNode.className = '';
            scope.imageNode.className = 'hidden';
            scope.spriteNode.width = effect.originalWidth;
            scope.spriteNode.height = effect.originalHeight;
        },
        _zoomHalfCompleted : function(scope) {
            scope.spriteNode.src = scope.active;
            scope.spriteNode.width = effect.originalWidth;
            scope.spriteNode.height = effect.originalHeight;
        },
        _zoomIterated : function(counter, number, scope) {
            var transformation = 'scale('+ (counter / number) +')';
            scope.spriteNode.style.webkitTransform =  transformation;
            scope.spriteNode.style.MozTransform =  transformation;
        },
        _zoomCompleted : function(scope) {
            scope.boundingBox.style.width = 'auto';
            scope.boundingBox.style.height = 'auto';
            scope.spriteNode.className = 'hidden';
            scope.imageNode.className = '';
            scope.imageNode.src = scope.active;
            $.unbind(scope.imageNode, 'load', scope.center);
            $.bind(scope.imageNode, 'load', scope.center);
        },
        /**
         * Move effect
         **/
        _moveIterated : function(counter, number, scope) {
            console.log(counter, effect.srcLeft);
            scope.boundingBox.style.left = effect.srcLeft
                + Math.ceil((effect.targetLeft - effect.srcLeft) / number * counter) + "px";
            scope.boundingBox.style.top  = effect.srcTop
                + Math.ceil((effect.targetTop - effect.srcTop) / number * counter) + "px";
        },
        _moveCompleted : function(scope) {
            scope.boundingBox.style.left = effect.targetLeft + "px";
            scope.boundingBox.style.top  = effect.targetTop + "px";
        }
};

bsShow.instace = null;

bsShow.prototype = {
        options : {
            'css' : 'blogslideshow.css',
            'effect' : 'fade'
        },
	images : [],
	active : null,
        backup : {},
        ie: false,

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
            if (navigator.userAgent.toLowerCase().indexOf("msie") != -1) {
                this.ie = true;
            }
            $.cssLoad(this.options.css);
            this._walkThroughA();
	},
        merge : function(options) {
            if (undefined !== options) {
                for (var key in options) {
                    this.options[key] = options[key];
                }
            }
        },
        center : function() {
            var scope = bsShow.instace;
            if (scope.imageNode.width < 300) {
                scope.imageNode.width = 300;
            }
            if (scope.imageNode.height < 300) {
                scope.imageNode.height = 300;
            }

            effect.targetLeft = Math.ceil(document.body.scrollLeft
                    + $.viewport().width/2 - scope.imageNode.width/2);
            effect.targetTop = Math.ceil(document.body.scrollTop
                    + $.viewport().height/2 - scope.imageNode.height/2);

            if (scope.options.effect && scope.backup.length) {
                effect.srcLeft = scope.backup.left;
                effect.srcTop = scope.backup.top;
                aQueue.add({
                    iteratedCallback: effect._moveIterated,
                    completedCallback: effect._moveCompleted,
                    iterations: 15,
                    delay: 200,
                    scope: this}).run();
            } else {
                scope.boundingBox.style.left = effect.targetLeft + "px";
                scope.boundingBox.style.top  = effect.targetTop + "px";
            }
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
        showImage : function(href) {
            if (null === href || !href.length) {
                return;
            }
            this.backup  = {
                left: this.imageNode.style.left.replace(/\,px$/, ""),
                top: this.imageNode.style.top.replace(/\,px$/, "")
            };
            this.active = href;
            if (this.options.effect && this.imageNode.src != href)  {
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
                this.imageNode.src = href;
            }

            $.unbind(this.prevBtnNode, 'click', this._onClickPrev);
            $.bind(this.prevBtnNode, 'click', this._onClickPrev);
            $.unbind(this.nextBtnNode, 'click', this._onClickNext);
            $.bind(this.nextBtnNode, 'click', this._onClickNext);
            $.unbind(this.closeBtnNode, 'click', this._onClickClose);
            $.bind(this.closeBtnNode, 'click', this._onClickClose);
            $.unbind(document, 'keydown', this._onKeypress);
            $.bind(document, 'keydown', this._onKeypress);
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
            if(bsShow.instace.ie) { var e = window.event; } else { e.preventDefault(); }
            e.returnValue = false; // IE fix
            bsShow.instace.timer = null;
            bsShow.instace.showImage(bsShow.instace.getNavigation().prev);
        },
        _onClickNext : function(e) {
            if(bsShow.instace.ie) { var e = window.event; } else { e.preventDefault(); }
            e.returnValue = false; // IE fix
            bsShow.instace.timer = null;
            bsShow.instace.showImage(bsShow.instace.getNavigation().next);
        },
        _onClickClose : function(e) {
            if(bsShow.instace.ie) { var e = window.event; } else { e.preventDefault(); }
            e.returnValue = false; // IE fix
            bsShow.instace.timer = null;
            document.body.removeChild(bsShow.instace.maskNode);
            document.body.removeChild(bsShow.instace.boundingBox);
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

            $.insert('div', '', {id:'ss-mask'});
            $.insert('div', tpl, {id:'ss-window'});

            this.maskNode = $('ss-mask');
            this.boundingBox = $('ss-window');
            this.toolbarNode = $('ss-toolbar');
            this.prevBtnNode = $('ss-prev');
            this.nextBtnNode = $('ss-next');
            this.closeBtnNode = $('ss-close');
            this.imageNode = $('ss-image');
            this.spriteNode = $('ss-sprite');

            $.unbind(this.maskNode, 'click', this._onClickClose);
            $.bind(this.maskNode, 'click', this._onClickClose);

            this.boundingBox.onmouseover = function(e) {
                if (null === aQueue.timer) {
                    bsShow.instace.toolbarNode.className = '';
                    bsShow.instace.oTimer = null;
                } else {
                    bsShow.instace.oTimer = setTimeout(bsShow.instace.boundingBox.onmouseover, 400);
                }
            };
            this.boundingBox.onmouseout = function(e) {
                bsShow.instace.toolbarNode.className = 'hidden';
            };
            if (!this.options.effect) {
                $.bind(this.imageNode, 'load', this.center);
            }
            window.onresize = this.center;
            this.center();
            this.showImage(href);
	},
        /**
         * Walks through A elements, looking for those which contains Rel=blogslideshow
         * Collect urls of images to be shown
         */
	_walkThroughA : function() {
            var i = 0;
            var links = document.getElementsByTagName("A");
            for(var j in links) {
                 var relAttr  = links[j].rel + ""; // as a String
                 var re = new RegExp("blogslideshow","gi");
                 if (relAttr && re.test(relAttr) && links[j].href) {
                    // Assigns onclick event for found links
                    links[j].onclick = function(e) {
                        if(bsShow.instace.ie) { var e = window.event; } else { e.preventDefault(); }
                        e.returnValue = false; // IE fix
                        bsShow.instace.start(this.href);
                    }
                    // Storages required info
                    this.images[i] = new Image();
                    this.images[i].src = links[j].href;
                    this.images[i].rel = links[j].href;
                    i++;
                 }
            }
	}
};

})(bsShow);