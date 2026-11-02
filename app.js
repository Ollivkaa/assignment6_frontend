
(function ($) {
  'use strict';

  var ICONS = {
    phone:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.2h2"/></svg>',
    glasses: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6.5" cy="14.5" r="3.5"/><circle cx="17.5" cy="14.5" r="3.5"/><path d="M10 14.5h4M3.2 13.5L4.5 7.5M20.8 13.5l-1.3-6"/></svg>',
    bag:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 8h13l-1 13h-11l-1-13z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg>',
    cup:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 10h11v4.5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5V10z"/><path d="M16 11.5h1.5a2.5 2.5 0 0 1 0 5H15.5"/><path d="M8.5 3.5v3M12 3.5v3"/></svg>',
    crumbs:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17.5V13l18-3.5v8z"/><path d="M3 13l4.5-6L21 9.5"/><path d="M6 21.5h.01M11 21.5h.01M16 21.5h.01" stroke-width="2.6"/></svg>',
    clock:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
    cap:     '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M2 9l10-5 10 5-10 5L2 9z"/><path d="M6 12v4.5c0 1.4 2.7 2.8 6 2.8s6-1.4 6-2.8V12" fill="none" stroke-width="2" stroke-linecap="round"/></svg>'
  };
  var COLORS = { red: '#e5484d', blue: '#3b82f6', green: '#1f9d62', black: '#24222e', yellow: '#f5b301', purple: '#8b5cf6' };
  var THINGS = ['phone', 'glasses', 'bag', 'cup', 'crumbs'];
  var THING_LABEL = { phone: 'Phone', glasses: 'Glasses', bag: 'Bag', cup: 'Cup', crumbs: 'Cake crumbs' };

  function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-'); }
  function toMinutes(t) { var p = t.split(':'); return (+p[0]) * 60 + (+p[1]); }
  function avatarUrl(name) { return 'https://api.dicebear.com/9.x/open-peeps/svg?seed=' + encodeURIComponent(name) + (LOOKS[name] || ''); }

  function makeGuest(g, room, floor, order) {
    var cls = ['guest', 'color-' + g.color];
    if (g.aitu) { cls.push('aitu'); }
    $.each(g.things, function (_, t) { cls.push('has-' + t); });

    var attrs = {
      'class': cls.join(' '),
      'data-name': g.name,
      'data-color': g.color,
      'data-time': g.time,
      'data-minutes': toMinutes(g.time),
      'data-aitu': g.aitu ? 'true' : 'false',
      'data-things': g.things.join(' ')
    };
    if (room !== undefined) { attrs['data-room'] = room; attrs['data-floor'] = floor; }
    if (order !== undefined) { attrs['data-order'] = order; }

    var $guest = $('<div>').attr(attrs);
    var $shell = $('<div class="g-shell">').appendTo($guest);
    var $face = $('<div class="g-face">').appendTo($shell);

    var $avatar = $('<div class="g-avatar">').appendTo($face);
    $('<img>').attr({ src: avatarUrl(g.name), alt: g.name, draggable: false }).appendTo($avatar);
    if (g.aitu) { $('<span class="g-badge" title="AITU student">').html(ICONS.cap).appendTo($avatar); }

    $('<div class="g-name">').text(g.name).appendTo($face);
    $('<div class="g-time">').html(ICONS.clock + '<span>' + g.time + '</span>').appendTo($face);

    var $things = $('<div class="g-things">').appendTo($face);
    $.each(THINGS, function (_, t) {
      if ($.inArray(t, g.things) > -1) {
        $('<span class="ico ico-' + t + '">').attr('title', THING_LABEL[t]).html(ICONS[t]).appendTo($things);
      }
    });
    return $guest;
  }


  function buildParty() {
    var $floors = $('#floors');
    $floors.find('.guest, .g-shell, .g-face, .room').stop(true);   
    $floors.empty();

    $.each([2, 1], function (_, n) {
      var $floor = $('<div class="floor">').attr({ id: 'floor-' + n, 'data-floor': n });
      $('<div class="floor-label">').append($('<span>').text('FLOOR ' + n)).appendTo($floor);
      var $rooms = $('<div class="rooms">').appendTo($floor);

      $.each(PARTY, function (_, r) {
        if (r.floor !== n) { return; }
        var $room = $('<section class="room">')
          .addClass('room-' + slug(r.room))
          .attr({ id: 'room-' + slug(r.room), 'data-room': r.room, 'data-floor': r.floor })
          .appendTo($rooms);
        var $title = $('<h3 class="room-title">').appendTo($room);
        $('<span class="room-name">').text(r.room).appendTo($title);
        var $guests = $('<div class="guests">').appendTo($room);
        $.each(r.guests, function (i, g) {
          makeGuest(g, r.room, r.floor, i).appendTo($guests);
        });
        Effects.decorateRoom($room);       
      });
      $floors.append($floor);
    });
  }

  
  function buildLegend() {
    var $l = $('#legend').empty();
    var $c = $('<div class="lg lg-colors"><div class="dots"></div><span>Clothing color</span></div>').appendTo($l);
    $.each(COLORS, function (name, hex) { $('<i>').css('background', hex).attr('title', name).appendTo($c.find('.dots')); });
    $.each(THINGS, function (_, t) {
      $('<div class="lg">').html('<span class="ico ico-' + t + '">' + ICONS[t] + '</span><span>' + THING_LABEL[t] + '</span>').appendTo($l);
    });
    $('<div class="lg">').html('<span class="lg-ic">' + ICONS.clock + '</span><span>Arrival time</span>').appendTo($l);
    $('<div class="lg">').html('<span class="g-badge static">' + ICONS.cap + '</span><span>AITU student</span>').appendTo($l);
  }

  var CASES = [
    { n: 1, kind: 'guests', short: 'Who is in the hall?', q: 'Who is in the hall?',
      run: function () {
        return $('#room-hall .guest');
      } },

    { n: 2, kind: 'guests', short: 'Yellow or purple', q: 'Who is dressed in yellow or purple?',
      run: function () {
        return $('.guest.color-yellow, .guest.color-purple');
      } },

    { n: 3, kind: 'guests', short: 'AITU upstairs', q: 'Which AITU students are upstairs?',
      run: function () {
        return $('.room[data-floor="2"] .guest[data-aitu="true"]');
      } },

    { n: 4, kind: 'guests', short: 'Glasses or a bag', q: 'Who has glasses or a bag?',
      run: function () {
        return $('.guest.has-glasses, .guest.has-bag');
      } },

    { n: 5, kind: 'guests', short: 'Came with nothing', q: 'Who came with nothing at all?',
      run: function () {
        return $('.guest:not(:has(.ico))');
      } },

    { n: 6, kind: 'guests', short: 'Phone, no bag', q: 'Who has a phone but no bag?',
      run: function () {
        return $('.guest.has-phone:not(.has-bag)');
      } },

    { n: 7, kind: 'guests', short: '20:30 to 21:00', q: 'Who arrived between 20:30 and 21:00, both times included?',
      run: function () {
        return $('.guest').filter(function () {
          var m = $(this).data('minutes');
          return m >= 20 * 60 + 30 && m <= 21 * 60;
        });
      } },

    { n: 8, kind: 'guests', short: 'After 21:00, not AITU', q: 'Who arrived after 21:00 and is not an AITU student?',
      run: function () {
        return $('.guest:not(.aitu)').filter(function () {
          return $(this).data('minutes') > 21 * 60;
        });
      } },

    { n: 9, kind: 'guests', short: 'Next to Askar', q: 'Who stands right next to Askar?',
      run: function () {
        return $('.guest[data-name="Askar"]').prev().add($('.guest[data-name="Askar"]').next());
      } },

    { n: 10, kind: 'guests', short: 'Last in each room', q: 'Who stands last in each room?',
      run: function () {
        return $('.guests > .guest:last-child');
      } },

    { n: 11, kind: 'guests', short: 'Third in each room', q: 'Who stands third in each room?',
      run: function () {
        return $('.guests > .guest:nth-child(3)');
      } },

    { n: 12, kind: 'guests', short: 'After Timur', q: 'Who stands after Timur in his room?',
      run: function () {
        return $('.guest[data-name="Timur"]').nextAll('.guest');
      } },

    { n: 13, kind: 'guests', short: 'Before someone in black', q: 'Who stands right before someone in black?',
      run: function () {
        return $('.guest.color-black').prev('.guest');
      } },

    { n: 14, kind: 'rooms', short: 'Where is Aruzhan?', q: 'In which room is Aruzhan?',
      run: function () {
        return $('.guest[data-name="Aruzhan"]').closest('.room');
      } },

    { n: 15, kind: 'rooms', short: 'Fewer than 6 guests', q: 'Which rooms have fewer than 6 guests?',
      run: function () {
        return $('.room').filter(function () {
          return $(this).find('.guest').length < 6;
        });
      } },

    { n: 16, kind: 'rooms', short: 'Cup, but no glasses', q: 'In which rooms does somebody have a cup, but nobody wears glasses?',
      run: function () {
        return $('.room:has(.has-cup):not(:has(.has-glasses))');
      } },

    { n: 17, kind: 'guests', short: 'First to each room', q: 'Who came first to each room?',
      run: function () {
        return $('.room').map(function () {
          return $(this).find('.guest').get().sort(function (a, b) {
            return $(a).data('minutes') - $(b).data('minutes');
          })[0];
        });
      } },

    { n: 18, kind: 'guests', short: 'Miras joins', q: 'Miras (AITU, blue, 21:20, phone) joins Askar and Inkar, standing between them. Let him appear smoothly.',
      run: function () {
        return Party.makeGuest({ name: 'Miras', color: 'blue', time: '21:20', aitu: true, things: ['phone'] })
          .hide()
          .insertAfter('.guest[data-name="Askar"]')
          .attr({ 'data-room': 'Living room', 'data-floor': 1 })
          .attr('data-order', function () { return +$(this).prev().attr('data-order') + 0.5; })
          .fadeIn(700);
      } },

    { n: 19, kind: 'guests', noJump: true, short: 'Natasha goes home', q: 'Natasha says goodbye and goes home. Her card fades away and disappears from the page.',
      run: function () {
        return $('.guest[data-name="Natasha"]').fadeOut(700, function () { $(this).remove(); });
      } },

    { n: 20, kind: 'guests', short: 'Who took the cake?', thief: true,
      q: 'Who took the cake? Downstairs, came after 21:00 but before the cake disappeared (21:30), has crumbs but no cup, and stood right next to an AITU student.',
      run: function () {
        return $('.room[data-floor="1"] .guest.has-crumbs:not(.has-cup)')
          .filter(function () {
            var m = $(this).data('minutes');
            return m > 21 * 60 && m < 21 * 60 + 30;
          })
          .filter(function () {
            return $(this).prev('.aitu').add($(this).next('.aitu')).length > 0;
          });
      } }
  ];
  function chainText(fn) {
    var s = fn.toString().replace(/^function\s*\(\)\s*\{\s*/, '').replace(/\s*\}\s*$/, '').trim();
    s = s.replace(/^return\s+/, '');
    var lines = s.split('\n'), min = 1e9;
    $.each(lines.slice(1), function (_, l) { if ($.trim(l)) { min = Math.min(min, l.match(/^\s*/)[0].length); } });
    if (min === 1e9) { min = 0; }
    return $.map(lines, function (l, i) { return i === 0 ? l : l.slice(min); }).join('\n');
  }

  function runCase(c) {
    Effects.reset();                      
    buildParty();

    var $found = c.run();
    $found.addClass('found');

    if (!c.noJump) {                                    
      $found.animate({ top: c.kind === 'rooms' ? -10 : -18 }, 170)
            .animate({ top: 0 }, 230);
    }
    showEvidence(c, $found);
    Effects.spotlight($found, c.kind);   
  }

  function showEvidence(c, $found) {
    var names = $found.map(function () { return $(this).data('name') || $(this).data('room'); }).get();
    var $ev = $('#evidence');
    $ev.find('.ev-no').text(c.n < 10 ? '0' + c.n : c.n);
    $ev.find('.ev-title').text(c.q);
    $ev.find('.ev-count').text(names.length);
    var $chips = $ev.find('.ev-chips').empty();
    $.each(names, function (_, nm) {
      $('<span class="chip">').toggleClass('thief', !!c.thief).text(nm).appendTo($chips);
    });
    if (!names.length) { $('<span class="chip none">').text('nobody').appendTo($chips); }
    $ev.find('.ev-code').text(chainText(c.run));
    $ev.toggleClass('solved', !!c.thief);
  }

  function buildButtons() {
    var $list = $('#case-list');
    $.each(CASES, function (_, c) {
      $('<button type="button" class="case-btn">')
        .attr('data-case', c.n)
        .attr('title', c.q)
        .html('<b>' + c.n + '</b><span>' + c.short + '</span>')
        .appendTo($list);
    });
    $list.on('click', '.case-btn', function () {
      var $b = $(this);
      $('.case-btn').removeClass('active');
      $b.addClass('active');
      runCase(CASES[$b.data('case') - 1]);
    });
  }

  
  window.Party = { makeGuest: makeGuest, build: buildParty, slug: slug, ICONS: ICONS, COLORS: COLORS,
                   THINGS: THINGS, THING_LABEL: THING_LABEL, avatarUrl: avatarUrl, CASES: CASES };

  $(function () {
    buildLegend();
    buildButtons();
    buildParty();
  });

}(jQuery));
