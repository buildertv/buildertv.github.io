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
    mouseScrool: FamilyTree.action.ctrlZoom,
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
                { type: 'textbox', label: 'Ngày sinh', binding: 'birthDate' },
                { type: 'textbox', label: 'Ngày mất', binding: 'deathDate' }
            ],
            { type: 'textbox', label: 'Số điện thoại', binding: 'phone' },
            [
                { type: 'select', options: countries, label: 'Quốc gia', binding: 'country' },
                { type: 'textbox', label: 'Tỉnh/ TP', binding: 'city' },
            ],
            { type: 'textbox', label: 'Địa chỉ', binding: 'address' },
            { type: 'textbox', label: 'Photo Url', binding: 'photo', btn: 'Upload' },
        ]
    },
});



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

family.on('field', function (sender, args) {
    if (args.name == 'photo') {
        // Kiểm tra nếu là thiết bị mobile (dựa trên width)
        if (window.innerWidth < 768) {
            args.value = ''; // Không hiển thị ảnh trên mobile
        } else {
            var top = `${FamilyTree.templates[args.node.templateName].start}px`;
            if (photoState && photoState[args.node.id]) {
                top = photoState[args.node.id];
            }
            args.value = `<foreignobject class="photo-foreignobject" x="0" y="0" width="${args.node.w}" height="${args.node.h}">
                            <div style="width: 100%; height: 100%; overflow: hidden; position: relative;">
                                <img data-img-node-id="${args.node.id}" style="position: absolute; top: ${top}; width: 100%; height: auto; object-fit: contain;" class="photo" src="${args.data.photo || 'path/to/placeholder.jpg'}" />
                            </div>
                        </foreignobject>`;
        }
    }
    else if (args.name == 'birthDate') {
        args.value = `${args.data.birthDate}`;
        if (args.data.deathDate) {
            args.value += ` - d. ${args.data.deathDate}`;
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
    if (exportType == 'text') {
        args.styles += `<style>
            .photo{display: none;}
            #bg-header {color: #fff !important; font-size: 21px;}
        </style>`;
    }
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
            var start0 = FamilyTree.templates[node0.templateName].start;
            var mid0 = FamilyTree.templates[node0.templateName].mid;
            var end0 = FamilyTree.templates[node0.templateName].end;
            if (photoElement0.style.top == mid0 + 'px') {
                startOptions.push({ opacity: 1 });
                endOptions.push({ opacity: 0 });
            }
            else {
                console.log(`node id ${node0.id}; opacity ${photoElement0.style.opacity}`)
                photoElement0.style.opacity = 0;
                photoElement0.style.top = mid0 + 'px';
                startOptions.push({ opacity: 0 });
                endOptions.push({ opacity: 1 });
            }

            var photoElement1 = randomPhotoElements[1];
            var node1 = family.getNode(photoElement1.getAttribute('data-img-node-id'));
            var start1 = FamilyTree.templates[node1.templateName].start;
            var mid1 = FamilyTree.templates[node1.templateName].mid;
            var end1 = FamilyTree.templates[node1.templateName].end;
            if (photoElement1.style.top == start1 + 'px') {
                end1 = mid1;
            }
            else if (photoElement1.style.top == mid1 + 'px') {
                start1 = mid1;
            }
            else if (photoElement1.style.top == end1 + 'px') {
                end1 = mid1;
            }
            startOptions.push({ top: start1 });
            endOptions.push({ top: end1 });

            if (Math.random() < 0.8) {
                var photoElement2 = randomPhotoElements[2];
                var node2 = family.getNode(photoElement2.getAttribute('data-img-node-id'));
                var start2 = FamilyTree.templates[node2.templateName].start;
                var mid2 = FamilyTree.templates[node2.templateName].mid;
                var end2 = FamilyTree.templates[node2.templateName].end;
                if (photoElement2.style.top == start2 + 'px') {
                    startOptions.push({ top: end2 });
                    endOptions.push({ top: mid2 });
                }
                else if (photoElement2.style.top == mid2 + 'px') {
                    startOptions.push({ top: mid2 });
                    endOptions.push({ top: start2 });
                }
                else if (photoElement2.style.top == end2 + 'px') {
                    startOptions.push({ top: end2 });
                    endOptions.push({ top: mid2 });
                }
            }

            FamilyTree.animate(randomPhotoElements, startOptions, endOptions, 700, FamilyTree.anim.inOutSin, function (elements) {
                for (var i = 0; i < elements.length; i++) {
                    var node = family.getNode(elements[i].getAttribute('data-img-node-id'));
                    var start = FamilyTree.templates[node.templateName].start;
                    var mid = FamilyTree.templates[node.templateName].mid;
                    var end = FamilyTree.templates[node.templateName].end;
                    if (!FamilyTree.isNEU(elements[i].style.opacity) && elements[i].style.opacity == 0) {
                        elements[i].style.top = start + 'px';
                        elements[i].style.opacity = 1;
                    }
                }
            });
        }
    }, 3000);
}

function getRandom(arr, n) {
    var result = new Array(n),
        len = arr.length,
        taken = new Array(len);
    if (n > len)
        throw new RangeError("getRandom: more elements taken than available");
    while (n--) {
        var x = Math.floor(Math.random() * len);
        result[n] = arr[x in taken ? taken[x] : x];
        taken[x] = --len in taken ? taken[len] : len;
    }
    return result;
}

var exportType = '';

function prevewPhotos(nodeId) {
    exportType = 'photos';
    FamilyTree.pdfPrevUI.show(family, {
        format: "A4",
        filename: 'GiaPhaHo.pdf',
        header: 'Gia phả Họ ...',
        footer: 'Page {current-page} of {total-pages}'
    });
}

function prevewText(nodeId) {
    exportType = 'text';
    FamilyTree.pdfPrevUI.show(family, {
        format: "A4",
        filename: 'GiaPhaHo.pdf',
        header: 'Gia phả Họ ...',
        footer: 'Page {current-page} of {total-pages}'
    });
}

// Sửa hàm toggleMode
function toggleMode() {
    var treeElement = document.getElementById('tree');
    var currentMode = family.config().mode;
    var newMode = currentMode === 'light' ? 'dark' : 'light';
    console.log(`Switching from ${currentMode} to ${newMode}`);
    family.config({ mode: newMode });
    treeElement.classList.remove(currentMode);
    treeElement.classList.add(newMode);
    family.draw();
}
function importJSONHandler(){
    family.importJSON();
}
function importXMLHandler(){
    family.importXML();
}
function importCSVHandler(){
    family.importCSV();
}
