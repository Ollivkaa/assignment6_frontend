(function ($) {
  'use strict';

  var Effects = window.Effects = {};

  var tracks = [];         
  var moving = {};        
  var sorted = {};          
  var card = { $el: null, $guest: null };  

  var FLY_MS = 900, GAP_MS = 700, SORT_MS = 650;

  function num(v) { return parseFloat(v) || 0; }
  function roomEl(name) { return $('#room-' + Party.slug(name)); }

  var PIN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>';
  var SORT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h9M4 12h6M4 17h3"/><path d="M18 5v14M15 16l3 3 3-3"/></svg>';
  var DOT = function (hex) { return '<i class="dotc" style="background:' + hex + '"></i>'; };


  Effects.reset = function () {
    closeCard(true);
    $('.info-card').stop(true).remove();
    $.each(tracks, function (_, t) { t.stop(true); });
    tracks = [];
    $('.flyer').stop(true).remove();
    moving = {};
    sorted = {};
  };

  Effects.decorateRoom = function ($room) {
    $('<button type="button" class="sort-btn">')
      .html(SORT + '<span>Sort by time</span>')
      .appendTo($room.children('.room-title'));
  };

  
  Effects.spotlight = function ($found) {
    var $keep = $found.find('.g-face');                     
    $('.guest .g-face').not($keep).stop(true).fadeTo(300, 0.2);
    $keep.stop(true).css('opacity', 1);
  };

  function clearSpotlight() {
    $('.g-face').stop(true).fadeTo(300, 1);
    $('.found').removeClass('found');
  }
  function dataOf($g) {
    return {
      name: $g.attr('data-name'), color: $g.attr('data-color'), time: $g.attr('data-time'),
      aitu: $g.attr('data-aitu') === 'true',
      things: ($g.attr('data-things') || '').split(' ').filter(Boolean),
      room: $g.attr('data-room'), floor: $g.attr('data-floor')
    };
  }

  function listWords(arr) {
    if (arr.length < 2) { return arr.join(''); }
    return arr.slice(0, -1).join(', ') + ' and ' + arr[arr.length - 1];
  }

  function buildCard(d, $g) {
    var A = { phone: 'a phone', glasses: 'glasses', bag: 'a bag', cup: 'a cup', crumbs: 'cake crumbs' };
    var things = $.map(d.things, function (t) { return A[t]; });
    var rooms = $('.room').map(function () { return $(this).attr('data-room'); }).get();

    var $c = $('<div class="info-card">').addClass('color-' + d.color);
    $('<img class="ic-seed" alt="">').attr('src', Party.avatarUrl(d.name)).appendTo($c);
    var $in = $('<div class="ic-inner">').appendTo($c);

    $('<button type="button" class="ic-close" aria-label="Close">').html('&times;').appendTo($in);
    var $head = $('<div class="ic-head">').appendTo($in);
    $('<div class="ic-avatar">').append($('<img alt="">').attr('src', Party.avatarUrl(d.name))).appendTo($head);
    var $t = $('<div>').appendTo($head);
    $('<h3>').text(d.name).appendTo($t);
    $('<span class="ic-room">').html(PIN + '<span>' + d.room + ' · Floor ' + d.floor + '</span>').appendTo($t);

    var facts = [
      [Party.ICONS.clock, 'Came at ' + d.time],
      [Party.ICONS.cap, d.aitu ? 'AITU student' : 'Not an AITU student'],
      [DOT(Party.COLORS[d.color]), 'Wearing ' + d.color],
      [Party.ICONS.bag, things.length ? 'Has ' + listWords(things) : 'Came with nothing']
    ];
    var $ul = $('<ul class="ic-facts">').appendTo($in);
    $.each(facts, function (_, f) {
      $('<li>').append($('<span class="fi">').html(f[0])).append($('<span>').text(f[1])).appendTo($ul);
    });

    var $mv = $('<div class="ic-move">').appendTo($in);
    $('<p>').text('Send to another room').appendTo($mv);
    var $btns = $('<div class="ic-btns">').appendTo($mv);
    $.each(rooms, function (_, r) {
      if (r === d.room) { return; }
      $('<button type="button" class="ic-btn">').attr('data-to', r)
        .text('Move to the ' + r.toLowerCase()).appendTo($btns);
    });
    return $c;
  }

  function openCard($g) {
    var d = dataOf($g);
    var $av = $g.find('.g-avatar'), a = $av.offset(), aw = $av.outerWidth();
    var $c = buildCard(d, $g);
    var $w = $(window);
    var W = Math.min(330, $w.width() - 24);

   
    $c.css({ width: W, visibility: 'hidden' }).appendTo('body');
    var H = $c.outerHeight();
    var sl = $w.scrollLeft(), st = $w.scrollTop(), vw = $w.width(), vh = $w.height();
    var L = Math.max(sl + 12, Math.min(a.left + aw / 2 - W / 2, sl + vw - W - 12));
    var T = Math.max(st + 12, Math.min(a.top - 40, st + vh - H - 130));

    var $in = $c.children('.ic-inner').css({ width: W, opacity: 0 });
    var $seed = $c.children('.ic-seed');
    $c.css({ visibility: 'visible', left: a.left, top: a.top, width: aw, height: aw, borderRadius: aw / 2, opacity: 0.6 });

    card = { $el: $c, $guest: $g };
    $c.animate({ left: L, top: T, width: W, height: H, borderRadius: 22, opacity: 1 }, {
      duration: 380, easing: 'swing',
      complete: function () { $c.css({ height: 'auto', overflow: 'visible' }); }
    });
    $seed.animate({ opacity: 0 }, 320);
    $in.delay(150).animate({ opacity: 1 }, 260);
  }

  function closeCard(instant) {
    var c = card;
    if (!c.$el) { return; }
    card = { $el: null, $guest: null };                 
    var $c = c.$el.stop(true).addClass('closing');
    if (instant === true || !$.contains(document.body, c.$guest[0])) { $c.remove(); return; }

    var $av = c.$guest.find('.g-avatar'), a = $av.offset(), aw = $av.outerWidth();
    $c.css('overflow', 'hidden');
    $c.children('.ic-inner').stop(true).animate({ opacity: 0 }, 110);
    $c.children('.ic-seed').stop(true).animate({ opacity: 1 }, 280);
    $c.animate({ left: a.left, top: a.top, width: aw, height: aw, borderRadius: aw / 2, opacity: 0.4 }, {
      duration: 320, easing: 'swing',
      complete: function () { $c.remove(); }
    });
  }


  function moveInArray(name, toName) {
    var rec = null;
    $.each(PARTY, function (_, r) {
      var i = -1;
      $.each(r.guests, function (j, g) { if (g.name === name) { i = j; return false; } });
      if (i > -1) { rec = r.guests.splice(i, 1)[0]; return false; }
    });
    if (!rec) { return; }                               
    $.each(PARTY, function (_, r) {
      if (r.room === toName) { r.guests.push(rec); return false; }
    });
  }

  function moveGuest($g, toName) {
    var name = $g.attr('data-name'), fromName = $g.attr('data-room');
    var $to = roomEl(toName);
    if (!$g.length || moving[name] || fromName === toName || !$to.length) { return; }
    moving[name] = true;
    moveInArray(name, toName);                        

    var s = $g.children('.g-shell').offset();           
    var w = $g.outerWidth(), h = $g.outerHeight();
    var ml = num($g.css('marginLeft')), mr = num($g.css('marginRight')), mb = num($g.css('marginBottom'));

   
    var $fly = $g.clone().removeAttr('data-name').removeClass('guest').addClass('flyer')
      .css({ left: s.left, top: s.top, width: w, margin: 0 }).appendTo('body');
    $fly.children('.g-shell').css({ left: 0, top: 0 });

    var $ghost = $('<div class="ghost">').css({ width: w, height: h, marginLeft: ml, marginRight: mr, marginBottom: mb });
    $g.before($ghost);
    $g.detach();
    $ghost.animate({ width: 0, marginLeft: 0, marginRight: 0 }, {
      duration: GAP_MS, complete: function () { $ghost.remove(); }
    });

   
    var $slot = $('<div class="slot">').css({ width: 0, height: h, marginLeft: 0, marginRight: 0, marginBottom: mb })
      .appendTo($to.children('.guests'));
    $slot.animate({ width: w, marginLeft: ml, marginRight: mr }, GAP_MS);

    var tr = $({ t: 0 });
    tracks.push(tr);
    tr.animate({ t: 1 }, {
      duration: FLY_MS, easing: 'swing',
      step: function (t) {
        var d = $slot.offset(), arc = Math.sin(Math.PI * t);
        $fly.css({
          left: s.left + (d.left - s.left) * t,
          top: s.top + (d.top - s.top) * t - arc * 90,
          transform: 'rotate(' + (Math.sin(Math.PI * 2 * t) * 6) + 'deg) scale(' + (1 + 0.14 * arc) + ')'
        });
      },
      complete: land
    });

    function land() {
      tracks = $.grep(tracks, function (x) { return x !== tr; });
      $fly.remove();
      $slot.stop(true);
      var max = -1;
      $to.find('.guest').each(function () { max = Math.max(max, num($(this).attr('data-order'))); });
      $g.removeAttr('style')
        .attr({ 'data-room': toName, 'data-floor': $to.attr('data-floor'), 'data-order': max + 1 })
        .children('.g-shell').css({ left: 0, top: 0 });
      $slot.replaceWith($g);
      delete moving[name];
      $g.animate({ top: -12 }, 110).animate({ top: 0 }, 150);   
      if (sorted[toName]) { applyOrder($to); }                  
    }
  }

  
  function ord(el) { return num($(el).attr('data-order')); }
  function mins(el) { return num($(el).attr('data-minutes')); }

  function applyOrder($room) {
    var rn = $room.attr('data-room');
    var $box = $room.children('.guests');
    var $cards = $box.children('.guest');
    var arr = $cards.get();
    var $shells = $cards.children('.g-shell').stop(true);  
    var first = $.map(arr, function (el) { return { p: $(el).children('.g-shell').offset() }; });

    arr.sort(function (a, b) {
      return sorted[rn] ? (mins(a) - mins(b) || ord(a) - ord(b)) : ord(a) - ord(b);
    });
    $.each(arr, function (_, el) { $box.append(el); });
    $box.children('.slot').appendTo($box);                 

    $shells.css({ left: 0, top: 0 });
    var last = $.map(arr, function (el) { return { p: $(el).children('.g-shell').offset() }; });

    var oldPos = {};
    $cards.each(function (i) { oldPos[$(this).attr('data-name')] = first[i].p; });

    $.each(arr, function (i, el) {
      var $s = $(el).children('.g-shell'), o = oldPos[$(el).attr('data-name')], n = last[i].p;
      var dx = o.left - n.left, dy = o.top - n.top;
      if (!dx && !dy) { return; }
      $s.css({ left: dx, top: dy, zIndex: 5 })
        .animate({ left: 0, top: 0 }, {
          duration: SORT_MS, easing: 'swing',
          complete: function () { $s.css('zIndex', ''); }
        });
    });
  }

 
  $(document).on('click', function (e) {
    var $t = $(e.target);
    if ($t.closest('.info-card').length) { return; }
    var $g = $t.closest('#floors .guest');
    if ($g.length) {                                        
      var same = card.$guest && card.$guest[0] === $g[0];
      closeCard();
      if (!same) { openCard($g); }
      return;
    }
    closeCard();                                          
  });

  $(document).on('keydown', function (e) {
    if (e.key === 'Escape') { closeCard(); }
  });

  $(document).on('click', '.ic-close', function () { closeCard(); });

  $(document).on('click', '.ic-btn', function () {
    var $g = card.$guest, to = $(this).attr('data-to');
    closeCard(true);
    if ($g) { moveGuest($g, to); }
  });

  $(document).on('click', '.sort-btn', function () {
    var $b = $(this), $room = $b.closest('.room'), rn = $room.attr('data-room');
    sorted[rn] = !sorted[rn];
    $b.toggleClass('on', !!sorted[rn]).children('span').text(sorted[rn] ? 'Picture order' : 'Sort by time');
    applyOrder($room);
  });

  $(document).on('click', '#clear-btn', clearSpotlight);

}(jQuery));
