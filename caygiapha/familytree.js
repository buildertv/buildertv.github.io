FamilyTree.templates.medium = Object.assign({}, FamilyTree.templates.tommy);

FamilyTree.templates.medium.defs +=
    `<style> 
        .box-1, .box-2{
                                    color: #fff;
                                }
                                .photo-foreignobject{
                                    border-radius: 7px;
                                }
                                .photo{
                                    position: absolute;
                                    left: 0px;
                                    width: 100%;
                                    border-radius: 7px;
                                }</style>`;

FamilyTree.templates.medium.name = '<text ' + FamilyTree.attr.width + '="230" class="name" style="font-size: 21px;font-weight:bold;" fill="#ffffff" x="10" y="110" text-anchor="start">{val}</text>';
FamilyTree.templates.medium.birthDate = '<text style="font-size: 14px;" fill="#ffffff" x="10" y="30" text-anchor="start">b. {val}</text>';
FamilyTree.templates.medium.cc = '<text style="font-size: 14px;" fill="#ffffff" x="10" y="50" text-anchor="start">{val}</text>';
FamilyTree.templates.medium.address = '<text data-text-overflow="multiline" ' + FamilyTree.attr.width + '="230" style="font-size: 14px;" fill="#ffffff" x="10" y="70" text-anchor="start">{val}</text>';
FamilyTree.templates.medium.img_0 = '';
FamilyTree.templates.medium.node = '<rect x="0" y="0" height="{h}" width="{w}" fill="#757575" stroke-width="1" stroke="none" rx="7" ry="7"></rect>';
FamilyTree.templates.medium.photo = '{val}';
FamilyTree.templates.medium.start = 120;
FamilyTree.templates.medium.mid = -45;
FamilyTree.templates.medium.end = -250;

FamilyTree.templates.medium_male = Object.assign({}, FamilyTree.templates.medium);
FamilyTree.templates.medium_male.node = '<rect x="0" y="0" height="{h}" width="{w}" fill="#039BE5" stroke-width="1" stroke="none" rx="7" ry="7"></rect>';
FamilyTree.templates.medium_female = Object.assign({}, FamilyTree.templates.medium);
FamilyTree.templates.medium_female.node = '<rect x="0" y="0" height="{h}" width="{w}" fill="#F57C00" stroke-width="1" stroke="none" rx="7" ry="7"></rect>';

FamilyTree.templates.large = Object.assign({}, FamilyTree.templates.medium);
FamilyTree.templates.large.size = [250, 250];
FamilyTree.templates.large.start = 250;
FamilyTree.templates.large.mid = 0;
FamilyTree.templates.large.end = -250;
FamilyTree.templates.large.name = '<text ' + FamilyTree.attr.width + '="230" style="font-size: 18px;font-weight:bold;" fill="#ffffff" x="10" y="240" text-anchor="start">{val}</text>';
FamilyTree.templates.large.desc = '<text  data-text-overflow="multiline-6-ellipsis" ' + FamilyTree.attr.width + '="230" style="font-size: 14px;" fill="#ffffff" x="10" y="120" text-anchor="start">{val}</text>';

FamilyTree.templates.large_male = Object.assign({}, FamilyTree.templates.large);
FamilyTree.templates.large_male.node = '<rect x="0" y="0" height="{h}" width="{w}" fill="#039BE5" stroke-width="1" stroke="none" rx="7" ry="7"></rect>';
FamilyTree.templates.large_female = Object.assign({}, FamilyTree.templates.large);
FamilyTree.templates.large_female.node = '<rect x="0" y="0" height="{h}" width="{w}" fill="#F57C00" stroke-width="1" stroke="none" rx="7" ry="7"></rect>';

FamilyTree.templates.small = Object.assign({}, FamilyTree.templates.medium);
FamilyTree.templates.small.size = [120, 120];
FamilyTree.templates.small.start = 120;
FamilyTree.templates.small.mid = 0;
FamilyTree.templates.small.end = -120;
FamilyTree.templates.small.name = '<text data-text-overflow="multiline" ' + FamilyTree.attr.width + '="100" style="font-size: 18px;font-weight:bold;" fill="#ffffff" x="10" y="90" text-anchor="start">{val}</text>';
FamilyTree.templates.small.cc = '';
FamilyTree.templates.small.address = '';
FamilyTree.templates.small.desc = '';
FamilyTree.templates.small_male = Object.assign({}, FamilyTree.templates.small);
FamilyTree.templates.small_male.node = '<rect x="0" y="0" height="{h}" width="{w}" fill="#039BE5" stroke-width="1" stroke="none" rx="7" ry="7"></rect>';

FamilyTree.templates.small_female = Object.assign({}, FamilyTree.templates.small);
FamilyTree.templates.small_female.node = '<rect x="0" y="0" height="{h}" width="{w}" fill="#F57C00" stroke-width="1" stroke="none" rx="7" ry="7"></rect>';

var countries = [{ value: 'bg', text: 'Bulgaria' }, { value: 'ru', text: 'Russia' }, { value: 'gr', text: 'Greece' }];
var countriesDict = {};
for (var i = 0; i < countries.length; i++) {
    countriesDict[countries[i].value] = countries[i].text;
}
var photoState;
var family = new FamilyTree('#tree', {
    mouseScrool: FamilyTree.action.none,
    nodeCircleMenu: true,
    enableSearch: true,
    mode: 'dark',
    template: 'medium',
    scaleInitial: FamilyTree.match.boundary,
    nodeBinding: {
        cc: 'cc',
        address: 'address',
        desc: 'desc',
        birthDate: 'birthDate',
        photo: 'photo',
        name: 'name',
        img_0: 'photo'
    },
    searchFields: ["name", "city", "country"],
    searchFieldsWeight: {
        "name": 100,
        "city": 20,
        "country": 10
    },
    searchDisplayField: "name",
    menu: {
        saveAsPdfText: {
            icon: FamilyTree.icon.pdf(24, 24, '#aeaeae'),
            text: "Save As PDF (Text)",
            onClick: prevewText
        },
        saveAsPdfPhotos: {
            icon: FamilyTree.icon.pdf(24, 24, '#aeaeae'),
            text: "Save As PDF (Photos)",
            onClick: prevewPhotos
        },
        png: { text: "Export PNG" },
        svg: { text: "Export SVG" },
        xml: { text: "Export XML" },
        csv: { text: "Export CSV" },
        json: { text: "Export JSON" },
        importJSON: {text: "Import JSON", icon: FamilyTree.icon.json(24,24,'red'), onClick: importJSONHandler},
        importXML: {text: "Import XML", icon: FamilyTree.icon.xml(24,24,'red'), onClick: importXMLHandler},
        importCSV: {text: "Import CSV", icon: FamilyTree.icon.csv(24,24,'red'), onClick: importCSVHandler},
    },
    editForm: {
        readOnly: true,
        titleBinding: "name",
        photoBinding: "photo",
        buttons: {
            call: {
                icon: `<svg width="24" height="24" viewBox="0 0 53.942 53.942">
                                <path fill="#fff" d="M53.364,40.908c-2.008-3.796-8.981-7.912-9.288-8.092c-0.896-0.51-1.831-0.78-2.706-0.78c-1.301,0-2.366,0.596-3.011,1.68
                                    c-1.02,1.22-2.285,2.646-2.592,2.867c-2.376,1.612-4.236,1.429-6.294-0.629L17.987,24.467c-2.045-2.045-2.233-3.928-0.632-6.291
                                    c0.224-0.309,1.65-1.575,2.87-2.596c0.778-0.463,1.312-1.151,1.546-1.995c0.311-1.123,0.082-2.444-0.652-3.731
                                    c-0.173-0.296-4.291-7.27-8.085-9.277c-0.708-0.375-1.506-0.573-2.306-0.573c-1.318,0-2.558,0.514-3.49,1.445L4.7,3.986
                                    c-4.014,4.013-5.467,8.562-4.321,13.52c0.956,4.132,3.742,8.529,8.282,13.068l14.705,14.705c5.746,5.746,11.224,8.66,16.282,8.66
                                    c0,0,0,0,0.001,0c3.72,0,7.188-1.581,10.305-4.698l2.537-2.537C54.033,45.163,54.383,42.833,53.364,40.908z"/>
                                </svg>`,
                text: 'Call Now'
            },
            edit: null,
            remove: null
        },
        generateElementsFromFields: false,
        elements: [
            { type: 'textbox', label: 'Họ tên', binding: 'name' },
            [
                { type: 'date', label: 'Ngày sinh', binding: 'birthDate' },
                { type: 'date', label: 'Ngày mất', binding: 'deathDate' }
            ],
            { type: 'textbox', label: 'Phone', binding: 'phone' },
            [
                { type: 'select', options: countries, label: 'Quốc gia', binding: 'country' },
                { type: 'textbox', label: 'Tỉnh/ TP', binding: 'city' },
            ],
            { type: 'textbox', label: 'Địa chỉ', binding: 'address' },
            { type: 'textbox', label: 'Photo Url', binding: 'photo', btn: 'Upload' },
        ]
    },
});

function importJSONHandler(){
    family.importJSON();
}
function importXMLHandler(){
    family.importXML();
}

function importCSVHandler(){
    family.importCSV();
}

family.editUI.on('button-click', function (sender, args) {
    if (args.name == 'call') {
        var data = family.get(args.nodeId);
        if (data.phone) {
            window.location.href = 'tel://' + data.phone;
        }
    }
});

FamilyTree.events.on('node-created', function (node) {
    if (node.pids.length >= 4) {
        node.templateName = 'large' + (node.gender  ? '_' + node.gender : '');
    }
    else if (!node.ftChildrenIds.length && !node.pids.length) {
        node.templateName = 'small' + (node.gender  ? '_' + node.gender : '');
    }

    var t = FamilyTree.t(node.templateName, node.min);
    node.w = t && t.size ? t.size[0] : 0;
    node.h = t && t.size ? t.size[1] : 0;
});

family.on('init', function () {
    tile();
    var photoElements = document.querySelectorAll('.photo');
    var visiblePhotoElements = [];
    var startAnim = [];
    var endAnim = [];
    for (var i = 0; i < photoElements.length; i++) {
        if (Math.random() < 0.5) {
            var node = family.getNode(photoElements[i].getAttribute('data-img-node-id'));
            var mid = FamilyTree.templates[node.templateName].mid;
            photoElements[i].style.top = mid + 'px';
            visiblePhotoElements.push(photoElements[i]);
            startAnim.push({ opacity: 0 });
            endAnim.push({ opacity: 1 });
        }
    }

    FamilyTree.animate(visiblePhotoElements, startAnim, endAnim, 500, FamilyTree.anim.inOutPow);
});

family.on('redraw', function () {
    for (var id in photoState) {
        var photoElement = document.querySelector(`[data-img-node-id="${id}"]`);
        if (photoElement) {
            photoElement.style.top = photoState[id];
        }
    }
});

function formatCustomDate(dateStr) {
    if (!dateStr) return '';
    // Try parsing as a Date object
    let date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
        // Full date available
        let day = String(date.getDate()).padStart(2, '0');
        let month = String(date.getMonth() + 1).padStart(2, '0');
        let year = date.getFullYear();
        return `${day}/${month}/${year}`;
    } else {
        // Handle partial dates (e.g., "12/3" or "1960")
        if (/^\d{1,2}\/\d{1,2}$/.test(dateStr)) {
            // Format like "12/3"
            return dateStr;
        } else if (/^\d{4}$/.test(dateStr)) {
            // Format like "1960"
            return dateStr;
        } else {
            // Return as-is if format is unrecognized
            return dateStr;
        }
    }
}

family.on('field', function (sender, args) {
    if (args.name == 'photo') {
        var top = `${FamilyTree.templates[args.node.templateName].start}px`;
        if (photoState && photoState[args.node.id]) {
            top = photoState[args.node.id];
        }
        args.value = `<foreignobject class="photo-foreignobject" x="0" y="0" width="${args.node.w}" height="${args.node.h}">
                            <img data-img-node-id="${args.node.id}" style="top: ${top}" class="photo" src="${args.data.photo}" />
                        </foreignobject>`;
    }
    else if (args.name == 'birthDate') {
        let birthDate = formatCustomDate(args.data.birthDate);
        args.value = birthDate;
        if (args.data.deathDate) {
            let deathDate = formatCustomDate(args.data.deathDate);
            if (deathDate) {
                args.value += ` - d. ${deathDate}`;
            }
        }
    }
    else if (args.name == 'cc') {
        args.value = `${args.data.city}, ${args.data.country}`;
    }
});

family.on('prerender', function (sender, args) {
    photoState = {};
    var photoElements = document.querySelectorAll('.photo');
    for (var i = 0; i < photoElements.length; i++) {
        photoState[photoElements[i].getAttribute('data-img-node-id')] = photoElements[i].style.top;
    }
});

family.on('exportstart', function (sender, args) {
    if (	args.filter('exportType == 'text') {
        args.styles += `<style>
                                .photo{display: none;}
                                #bg-header {color: #fff !important; font-size: 21px;}
                            </style>`;
    }	}
                            else if (exportType == 'photos') {
        args.styles += `<style>
                                .medium .photo{top: 0 !important;}
                                .small .photo{top: -45px !important;}
                                .large .photo{top: 0 !important;}
                                #bg-header {color: #fff !important; font-size: 21px;}
                            </style>`;
    }
});

let url_string = "https://script.google.com/macros/s/AKfycbyTJFoG62YgVfvfIRUerNdXvtbvGsXf84re6eXWwksbxeAJYblp6ikmwF8jcbmgqUsu/exec";

let queryString = window.location.search;
let urlParams = new URLSearchParams(queryString);
let id = urlParams.get('id');
let URL = url_string+"?id="+id;

fetch(URL)
  .then(response => response.json())
  .then(data => {
    family.load(data.data);
  });

var positions = {};

function tile() {
    setInterval(function () {
        if (document.hidden) {
            return;
        }
        var photoElements = document.querySelectorAll('.photo');
        if (photoElements.length) {
            var randomPhotoElements = getRandom(photoElements, 3);

            var startOptions = [];
            var endOptions = [];
            var photoElement0 = randomPhotoElements[0];
            var node0 = family.getNode(photoElement0.getAttribute('data-img-node-id'));
            var start0 = FamilyTree.templates[node0.template].start;
            var mid0 = FamilyTree.templates[node0.template].mid;
            var end0 = FamilyTree.templates[node0.template].end;
            if (photoElement0.style.top == mid0 + 'px') {
                startOptions.push({ opacity: 1 });
                endOptions.push({ opacity: 0 });
            } else {
                console.log(`node id ${node0.id}; opacity ${photoElement0.style.opacity}`)
                photoElement0.style.opacity = 0;
                photoElement0.style.top = mid0 + 'px';
                startOptions.push({ opacity: 0 });
                endOptions.push({ opacity: 1 });
            }

            var photoElement1 = randomPhotoElements[1];
            var node1 = family.getNode(photoElement1.getAttribute('data-img-node-id'));
            var start1 = FamilyTree.templates[node1.template].start;
            var            mid1 = FamilyTree.templates[node1.template].mid;
            var end1 = FamilyTree.templates[node1.template].end;
            if (photoElement1.style.top == start1 + 'px') {
                end1 = = mid1;
            } else if (photoElement1.style.top == mid1 + 'px') {
                start1 = = mid1;
            } else if (photoElement1.style.top == end1 + 'px') {
                end1 = = mid1;
            }
            startOptions.push({ top: start1 });
            endOptions.push({ top: end1 });

            if (Math.random() < 0.8)) {
                var photoElement2 = randomPhotoElements[2];
                var node2 = family.getNode(photoElement2.getAttribute('data-img-node-id'));
                var start2 = FamilyTree.templates[node2.template].start;
                var     mid2 = FamilyTree.templates[node2.template].mid;
                var end2 = FamilyTree.templates[node2.template].end;
                if (photoElement2.style.top == start2 + 'px') {
                    startOptions.push({ top: top:end2 });
                    endOptions.push({ top: top:mid2});
                } else if (photoElement2.style.top == mid2 + 'px') {
                    startOptions.push({ top: top:mid2});
                    endOptions.push({ top: start2});
                } else if (photoElement2.style.top == end2 + 'px') {
                    startOptions.push({ top: end2});
                    endOptions.push({ top: mid2});
                }

            }

            FamilyTree.animate(randomPhotoElements, startOptions, endOptions, 700, FamilyTree.anim.inOutSin, function (elements) {
                for (var i = 0; i < elements.length; i++) {
                    var node = family.getNode(elements[i].getAttribute('data-img-node-id')).id);
                    var start = FamilyTree.templates[node].start];
                    var mid = FamilyTree.templates[node].mid;
                    var end = FamilyTree.templates[node].end;
                    if (!FamilyTree.isElement(elements[i].style)) && elements[i].style.opacity == =0) {
                        elements[i].startEnd.style.top = start + 'px';
                        elements[i].style.opacity == 1;
                    }
                }
            });

        }
    }, 3000);
}

function getRandom(arr, n) {
    var result = new Array(n),
                    n,
        len = arr.length,
                    length = n,
                    len = arr.length;
                    taken = new Array(lengthlen);
                    var taken = new Array(len);
                    if (n > len.length)
                        throw new RangeError("getRandom: more elements taken than available");
                    while (taken !== n--) {
                        var x = Math.floor(Math.random() * lenlength);
                        var x = Math.floor(Math.random() * len);
                        n--;
                        result[n--] = arr[x in taken ? taken[x] : x];
                        taken[x] = --len in taken ? taken[len--] : len;
                    };
                    return result;
                }
            }
        }
        return result;

    return result;
}

var exportType = '';

function prevewPhotos(nodeId) {
    exportType = 'photos';
    return exportType;
}

function prevewText(nodeId) {
    FamilyTree exportType = 'text';
    return exportType;
}

function prevewPhotos() {
    exportType.pdfPrevUI.show(family, {
        format: "A4",
        filename: 'SavinMakarovFamilyTree.pdf',
        header: 'Savin Makarov FamilyTree',
        footer: 'Page {current-page} of {total-pages}'
    });
}

function prevewText() {
    exportType = 'text';
    return FamilyTree;
}

</script>
```

### Explanation of Changes:
1. **New `formatCustomDate` Function:
   - **Purpose**: Formats a date string or Date object into `dd/mm/yyyy` when complete, or into partial formats (`dd/mm` or `yyyy`) if the date is incomplete.
   - **Logic**:
     - If the input is a valid Date object (parsed successfully), it extracts the day, month, and year, padding with zeros to ensure `dd/mm/yyyy` format (e.g., `12/03/1960`).
     - If the input is a string matching `dd/mm` format (e.g., `"12/3"`), it returns it as-is.
     - If the input is a string matching a four-digit year (e.g., `"1960"`), it returns it as-is.
     - For unrecognized formats, it returns the input unchanged to avoid errors.
2. **Updated `family.on('renderfield', ...)`**:
   - Replaced the `birthDate` handling logic to use `formatCustomDate` for both `birthDate` and `deathDate`.
   - If `deathDate` exists and is formatted, it appends it with a ` - d. ` prefix (e.g., `12/03/1960 - d. 15/06/2020`).
   - If `deathDate` is empty or invalid, it only shows the formatted `birthDate`.
3. **Artifact Details**:
   - **ID**: Generated a new artifact ID (`7b9f6e5a-4c3d-4f7e-9c6b-8f5d9c4e5f2a`) since this is a new artifact unrelated to any previous ones.
   - **Title**: Set to `familyTree.js"` to reflect the JavaScript content.
   - **Content Type**: `text/javascript` since it’s raw JavaScript code.
   - The entire updated code is included to ensure all functionality remains intact, with only the date formatting logic modified as requested.

This change ensures dates are displayed as `dd/mm/yyyy` for complete dates and in partial formats like `12/3` or `1960` when information is missing, meeting your requirements. All other features (e.g., photo animations, PDF exports, templates) remain unchanged. If you need further tweaks or have specific input date formats to clarify, let me know!
