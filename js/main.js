'use strict';
const sharedFetchParams = {
  action: 'query',
  prop: 'imageinfo|revisions',
  format: 'json',
  rvprop: 'timestamp|user',
  generator: 'categorymembers',
  gcmprop: 'title|type|timestamp',
  gcmnamespace: '6',
  gcmlimit: 500,
  gcmsort: 'timestamp',
};
const rangConfig = {
  url: 'https://id.wikipedia.org',
};
const today = new Date();
const lastWeek = new Date(
  today.getFullYear(),
  today.getMonth(),
  today.getDate() - 7,
  today.getHours(),
  today.getMinutes(),
  today.getSeconds(),
  today.getMilliseconds()
);

$(document).ready(function () {
  /**
   * [[Kategori:Artikel yang layak untuk dihapus]]
   * [[Kategori:Halaman yang telah jatuh tempo penghapusan]]
   */
  let dataStore = {};
  let imageUsageStore = {};
  let imageContentStore = {};
  let imageThumbStore = {};
  let pageState = {
    selectedPageId: null,
    reason: '[[WP:KPC#B5]]',
  };

  fetchData();
  function render() {
    if (pageState.selectedPageId) {
      fetchImageInfo(pageState.selectedPageId);
    }
    renderInitial();
    renderMainView();
  }
  async function fetchData() {
    await Promise.all([fetchAfdState(), fetchAfdDuedState()]);
    const firstDatum = Object.values(dataStore);
    pageState.selectedPageId = firstDatum[0] ? firstDatum[0].pageid : null;
    render();
  }
  async function fetchAfdState() {
    const response = await $.ajax({
      url: rangConfig.url + '/w/api.php',
      dataType: 'jsonp',
      data: {
        ...sharedFetchParams,
        gcmtitle: 'Kategori:Artikel yang layak untuk dihapus',
        gcmend: lastWeek.toISOString(),
      },
    });

    if (!response.query) {
      console.warn('[fetchAfdState] No data', response);
      return;
    }
    dataStore = { ...dataStore, ...response.query.pages };
  }
  async function fetchAfdDuedState() {
    const response = await $.ajax({
      url: rangConfig.url + '/w/api.php',
      dataType: 'jsonp',
      data: {
        ...sharedFetchParams,
        gcmtitle: 'Kategori:Halaman yang telah jatuh tempo penghapusan',
        gcmend: new Date().toISOString(),
      },
    });
    if (!response.query) {
      console.warn('[fetchAfdDuedState] No data', response);
      return;
    }
    dataStore = { ...dataStore, ...response.query.pages };
  }
  async function fetchImageInfo(pageid) {
    if (!pageid) {
      return;
    }
    if (imageUsageStore[pageid]) {
      // Data already fetched, do early return to avoid infinite recursion
      return;
    }
    const title = dataStore[pageid].title;
    const response = await $.ajax({
      url: rangConfig.url + '/w/api.php',
      dataType: 'jsonp',
      data: {
        action: 'query',
        prop: 'revisions|imageinfo',
        list: 'imageusage',
        iiprop: 'url',
        iiurlwidth: 220,
        format: 'json',
        rvprop: 'content',
        rvparse: 1,
        pageids: pageid,
        iulimit: 500,
        iutitle: title,
      },
    });
    if (!response.query) {
      console.warn('[fetchImageInfo] No data', pageid, response);
      return;
    }
    imageUsageStore = {
      ...imageUsageStore,
      [pageid]: response.query.imageusage,
    };

    const html = response.query.pages[pageid].revisions[0]['*'].replace(
      /href="\/w/g,
      'href="' + rangConfig.url + '/w'
    );
    imageContentStore = {
      ...imageContentStore,
      [pageid]: html,
    };

    imageThumbStore = {
      ...imageThumbStore,
      [pageid]: response.query.pages[pageid].imageinfo[0].thumburl,
    };

    render();
  }

  function handleItemClicked() {
    let pageid = $(this).data('pageid');
    pageState.selectedPageId = pageid;
    render();
  }

  function renderInitial() {
    const children = [];
    for (const item of Object.values(dataStore)) {
      children.push(
        $('<li/>', {
          html: $('<a/>', {
            class: 'rang-item',
            id: 'rang-item-' + item.pageid,
            href: '#',
            'data-pageid': item.pageid,
            text: item.title,
          }),
        })
      );
    }
    $('#rang-nav > ul').html(children);

    $('.rang-item').on('click', handleItemClicked);
  }

  function renderMainView() {
    const pageid = pageState.selectedPageId;
    if (!pageid) {
      return;
    }

    const data = dataStore[pageid];
    if (!data) {
      return;
    }
    const imageUsages = imageUsageStore[pageid]
      ? Object.values(imageUsageStore[pageid])
      : [];
      
    $('#rang-main').html(
      $('<div/>')
        .append(
          $('<div/>', {
            id: 'rang-right',
            html: $('<img />', {
              id: 'rang-thumb',
              width: 220,
              src: imageThumbStore[pageid] ? imageThumbStore[pageid] : null,
            }),
          }).append(
            $('<div/>', {
              id: 'rang-iu',
            }).append(
              $('<ul />').html(
                imageUsages.map((imageUsage) => {
                  return $('<li/>', {
                    html: $('<a/>', {
                      href: rangConfig.url + '/wiki/' + imageUsage.title,
                      text: imageUsage.title,
                    }),
                  });
                })
              )
            )
          )
        )
        .append(
          $('<h1/>', {
            html: $('<a/>', {
              href: rangConfig.url + '/wiki/' + data.title,
              text: data.title,
              target: '_blank',
            }),
          })
        )
        .append('<br />')
        .append(
          $('<input/>', {
            id: 'rang-reason',
            type: 'text',
            class: 'form-control',
            placeholder: 'Alasan penghapusan',
            value: pageState.reason,
          }).on('input', function () {
            pageState.reason = $(this).val();
          })
        )
        .append(
          $('<button />', {
            class: 'btn btn-danger',
            text: 'Hapus',
            id: 'rang-delete',
            'data-pageid': pageid,
          }).on('click', async function () {
            const reason = pageState.reason;
            $(this).attr('disabled', 'disabled');
            const response = await $.ajax({
              url: 'handler.php',
              dataType: 'json',
              data: {
                func: 'delete_image',
                x1: pageid,
                x2: reason,
              },
            });
            $(this).removeAttr('disabled');
            if (!!response.delete) {
              delete dataStore[pageid];
              const nextPageid = $('#rang-item-' + pageid)
                .parent()
                .next()
                .children()
                .data('pageid');
              if (nextPageid) {
                pageState.selectedPageId = nextPageid;
              }

              render();
            } else {
              alert('Gagal menghapus berkas dengan id ' + pageid);
            }
          })
        )
        .append(
          $('<div />', {
            id: 'rang-content',
            text: 'Memuat ...',
          })
        )
    );
    $('#rang-status-img-timestamp').text(data.imageinfo[0].timestamp);
    $('#rang-status-img-user').html(
      $('<a/>', {
        href: rangConfig.url + '/wiki/User:' + data.imageinfo[0].user,
        text: data.imageinfo[0].user,
      })
    );
    $('#rang-status-rev-timestamp').text(data.revisions[0].timestamp);
    $('#rang-status-rev-user').html(
      $('<a/>', {
        href: rangConfig.url + '/wiki/User:' + data.revisions[0].user,
        text: data.revisions[0].user,
      })
    );
    if (
      $('#rang-username').length === 0 ||
      $('#rang-username').data('can-delete') !== 1
    ) {
      $('#rang-delete').attr('disabled', 'disabled');
    }
    if (imageContentStore[pageid]) {
      $('#rang-content').html(imageContentStore[pageid]);
    }
  }
});
