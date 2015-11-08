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
        gcmend: "2015-10-26T00:00:00Z"
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
    $("main").text(JSON.stringify(data));
    $(".rang-item").on("click", function () {
      $("#rang-nav .active").removeClass("active");
      $(this).parent().addClass("active");
      var pageid = $(this).data("pageid");
      var data = rangData[pageid];
      $("main").text(JSON.stringify(data));
    });
  }.bind(this));

});
