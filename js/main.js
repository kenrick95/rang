$(document).ready(function () {
  var rangConfig = {
    url: "//id.wikipedia.org",
    reason: "[[WP:KPC#B5]]"
  };
  var rangData = null;
  var today = new Date();
  var lastWeek = new Date(today.getFullYear(), today.getMonth(),
    today.getDate() - 7, today.getHours(), today.getMinutes(),
    today.getSeconds(), today.getMilliseconds());

  $.ajax({
      url: rangConfig.url + "/w/api.php",
      dataType: "jsonp",
      data: {
        action: "query",
        prop: "imageinfo|revisions",
        format: "json",
        rvprop: "timestamp|user",
        generator: "categorymembers",
        gcmtitle: "Kategori:Artikel yang layak untuk dihapus",
        gcmprop: "title|type|timestamp",
        gcmnamespace: "6",
        gcmlimit: 500,
        gcmsort: "timestamp",
        gcmend: lastWeek.toISOString()
      }
  }).done(function(data) {
    if (!data.query) {
      console.warn('Either no data or error', data)
      return;
    }
    rangData = data.query.pages;
    var coll = $("<div/>");
    for (var x in rangData) {
      if (rangData.hasOwnProperty(x)) {
        $(coll).append($("<li/>", {
          html: $("<a/>", {
            class: "rang-item",
            id: "rang-item-" + x,
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
            href: rangConfig.url + "/wiki/" + data.title,
            text: data.title,
            target: "_blank"
          })
        }))
        .append("<br>")
          .append($("<input/>", {
            id: "rang-reason",
            type: "text",
            class: "form-control",
            placeholder: "Alasan penghapusan",
            value: rangConfig.reason
          }))
          .append($("<button/>", {
          class: "btn btn-danger",
          text: "Hapus",
          id: "rang-delete",
          "data-pageid": pageid
        }))
        .append($("<div/>", {
          id: "rang-content",
          text: "Memuat ..."
        }));
      $("#rang-status-img-timestamp").text(data.imageinfo[0].timestamp);
      $("#rang-status-img-user").html($("<a/>", {
        href: rangConfig.url + "/wiki/User:" + data.imageinfo[0].user,
        text: data.imageinfo[0].user
      }));
      $("#rang-status-rev-timestamp").text(data.revisions[0].timestamp);
      $("#rang-status-rev-user").html($("<a/>", {
        href: rangConfig.url + "/wiki/User:" + data.revisions[0].user,
        text: data.revisions[0].user
      }));

      $.ajax({
          url: rangConfig.url + "/w/api.php",
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
                  href: rangConfig.url + "/wiki/" + iu[iuKey].title,
                  text: iu[iuKey].title
                })
              }));
            }
          }

          $("#rang-iu").append(collIu);
        }


        var html = data.query.pages[pageid].revisions[0]['*'];
        html = html.replace(/href="\/w/g, 'href="' + rangConfig.url + '/w');
        $("#rang-content").html(html);
        $("#rang-thumb").attr("src", data.query.pages[pageid].imageinfo[0].thumburl);
      });

      $("#rang-main").html(coll);

      $("#rang-reason").on("input", function () {
        rangConfig.reason = $(this).val();
      });
      if ($("#rang-username").length === 0 ||
        $("#rang-username").data('can-delete') !== 1) {
        $("#rang-delete").attr("disabled", "disabled");
      }

      $("#rang-delete").on("click", function () {
        var pageid = $(this).data('pageid'),
          reason = rangConfig.reason;
        $(this).attr("disabled", "disabled");
        $.ajax({
            url: "handler.php",
            dataType: "json",
            data: {
              func: "delete_image",
              x1: pageid,
              x2: reason
            }
        }).done(function (data) {
          $("#rang-delete").removeAttr("disabled");
          if (!!data.delete) {
            //$("#rang-item-" + pageid).parent().next().children().click();
            $("#rang-item-" + pageid).parent().remove();
          } else {
            alert("Gagal menghapus berkas dengan id " + pageid);
              $("#rang-item-" + pageid).click();
          }

        });
        $("#rang-item-" + pageid).parent().next().children().click();
      });
    });
  }).done(function () {
    $(".rang-item").first().click();
  });
  function resizeHandler() {
    var newHeight = $(window).innerHeight() - 65;

    $("#rang-main").height(newHeight);
    $("#rang-nav").height(newHeight);
  }
  $(window).resize(resizeHandler);
  resizeHandler();



});
