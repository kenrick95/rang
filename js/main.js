$(document).ready(function () {
  var rangData = null;
  $.ajax({
      url: "https://id.wikipedia.org/w/api.php",
      dataType: "jsonp",
      data: {
        action: "query",
        prop: "imageinfo|revisions",
        format: "json",
        rvprop: "timestamp|user",
        generator: "categorymembers",
        gcmtitle: "Kategori:Artikel yang layak untuk dihapus",
        gcmprop: "title|type|timestamp",
        gcmnamespace: "0|1|2|3|4|5|6|7|8|9|10|11|12|13|15|100|101|828|829|2300|2301|2302|2303|2600",
        gcmlimit: 500,
        gcmsort: "timestamp",
        gcmend: "2015-10-31T00:00:00Z"
      }
  }).done(function(data) {
    rangData = data.query.pages;
    var coll = $("<div/>");
    for (var x in rangData) {
      if (rangData.hasOwnProperty(x)) {
        $(coll).append($("<li/>", {
          html: $("<a/>", {
            class: "rang-item",
            href: "#",
            "data-pageid": x,
            text: rangData[x].title
          })
        }));
      }
    }
    $("#rang-nav > ul").append(coll.children());
    $(".rang-item").on("click", function () {
      $("#rang-nav .active").removeClass("active");
      $(this).parent().addClass("active");
      var pageid = $(this).data("pageid");
      var data = rangData[pageid];
      var coll = $("<div/>")
        .append($("<div/>", {
          id: "rang-right",
          html: $("<img/>", {
            id: "rang-thumb",
            width: 220
          })
        }).append($("<div/>", {
          id: "rang-iu",
        })))
        .append($("<h1/>", {
          html: $("<a/>", {
            href: "//id.wikipedia.org/wiki/" + data.title,
            text: data.title,
            target: "_blank"
          })
        }))
        .append($("<div/>", {
          id: "rang-content",
          text: "Memuat ..."
        }));
      $("#rang-status-img-timestamp").text(data.imageinfo[0].timestamp);
      $("#rang-status-img-user").html($("<a/>", {
        href: "//id.wikipedia.org/wiki/User:" + data.imageinfo[0].user,
        text: data.imageinfo[0].user
      }));
      $("#rang-status-rev-timestamp").text(data.revisions[0].timestamp);
      $("#rang-status-rev-user").html($("<a/>", {
        href: "//id.wikipedia.org/wiki/User:" + data.revisions[0].user,
        text: data.revisions[0].user
      }));
      // "http://rest.wikimedia.org/id.wikipedia.org/v1/page/html/" + data.title

      $.ajax({
          url: "https://id.wikipedia.org/w/api.php",
          dataType: "jsonp",
          data: {
            action: "query",
            prop: "revisions|imageinfo",
            list: "imageusage",
            iiprop: "url",
            iiurlwidth: 220,
            format: "json",
            rvprop: "content",
            rvparse: 1,
            pageids: pageid,
            iulimit: 500,
            iutitle: data.title
          }
      }).done(function(data) {
        var iu = data.query.imageusage;

        if (iu.length > 0) {
          var collIu = $("<ul/>");
          for (var iuKey in iu) {
            if (iu.hasOwnProperty(iuKey)) {
              collIu.append($("<li/>", {
                html: $("<a/>", {
                  href: "//id.wikipedia.org/wiki/" + iu[iuKey].title,
                  text: iu[iuKey].title
                })
              }));
            }
          }

          $("#rang-iu").append(collIu);
        }


        var html = data.query.pages[pageid].revisions[0]['*'];
        html = html.replace(/href="\/w/g, 'href="//id.wikipedia.org/w');
        $("#rang-content").html(html);
        $("#rang-thumb").attr("src", data.query.pages[pageid].imageinfo[0].thumburl);
      });

      $("#rang-main").html(coll);
    });
  }).done(function () {
    $(".rang-item").first().click();
  });


});
