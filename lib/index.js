//服务器地址
var SERVER_URL = ""

//文档标题
var API_TITLE = "API-DOCS"

//头部参数
var HEADERS_LIST = []

//选取文档面板对象
var API_DOCS = document.getElementById("accordion-main")

//初始化文档
initDocs()


//读取配置文件
function initDocs() {

    let models = new Array()

    //读取配置文件
    readJosnFile('docs/config.json', function(json) {
        SERVER_URL = json.server
        API_TITLE = json.title
        HEADERS_LIST = json.headers
        loadHeaders(json.headers)
        document.getElementById('index-title').innerHTML = API_TITLE

        //读取文档JSON
        for (let i = 0; i < json.docs.length; i++) {
            readJosnFile('docs/' + json.docs[i], function(json) {
                models[i] = getModePad(json, i)
            })
        }

        let timer = window.setInterval(function() {
            if (models.length == json.docs.length) {
                models.forEach(function(e) {
                    API_DOCS.appendChild(e)
                })
                window.clearInterval(timer)
            }
            console.log("文档加载结束")
        }, 300)
    })

}


//获取JSON文件
function readJosnFile(file, callback) {
    let requester = new XMLHttpRequest()
    requester.open('get', file)
    requester.addEventListener('load', function(res) {
        try {
            json = JSON.parse(res.target.responseText)
            callback(json)
        } catch (e) {
            console.log(file + " 文档错误，请检查文档格式")
        }
    })
    requester.addEventListener('error', function(res) {
        console.error(file + " load failed")
        console.error(res)
    })
    requester.send()
}

//获取完整的Model面板
function getModePad(modelJson, index) {
    var modelDom = getApiModelDom(modelJson.title, index)

    for (let i = 0; i < modelJson.forms.length; i++) {
        let formJson = modelJson.forms[i]
        let inputs = ""
        for (let j = 0; j < formJson.inputs.length; j++) {
            let inputJson = formJson.inputs[j]
            if (!inputJson.type || inputJson.type == 'text') {
                inputs += getInputHtml(inputJson.name, inputJson.description)
            } else if (inputJson.type == 'file') {
                inputs += getFileHtml(inputJson.name, inputJson.description, inputJson.multiple || false)
            }
        }
        formDom = getFormDom(formJson.title, formJson.description, modelDom.id, i, inputs, formJson.method, formJson.url)
        modelDom.appendChild(formDom)
    }

    return getApiModelPad(modelJson.title, index, modelDom.innerHTML)
}

//获取一个Model外壳
function getApiModelPad(title, index, html) {
    let divDom = document.createElement('div')
    divDom.className = "panel panel-success"
    divDom.style = ""
    divDom.innerHTML = `
        <div class="panel-heading" role="tab">
            <h4 class="panel-title">
                <a role="button" data-toggle="collapse" data-parent="#accordion-main" href="#model-page-${index}-${title}" aria-expanded="true" aria-controls="model-page-${index}-${title}">
                  <i class="fa fa-circle-o fa-fw" aria-hidden="true"></i>${title}
                </a>
            </h4>
        </div>
        <div id="model-page-${index}-${title}" class="panel-collapse collapse" role="tabpanel">
            <div class="panel-body">
                ${html}
            </div>
        </div>
        `
    return divDom
}

//生成一个Model面板
function getApiModelDom(title, index) {
    let divDom = document.createElement('div')
    divDom.id = 'apimodel-' + index
    divDom.className = "panel-group"
    divDom.setAttribute('role', 'tablist')
    divDom.setAttribute('aria-multiselectable', "true")
    return divDom
}

//生成一个Form面板
function getFormDom(title, description, parentid, index, inputs, method, url) {
    let divDom = document.createElement('div')
    let span = method == 'get' ? '<span class="label label-info">GET</span>' : (method == 'post' ? '<span class="label label-success">POST</span>' : (method == 'put' ? '<span class="label label-primary">PUT</span>' : '<span class="label label-danger">DELETE</span>'))
    divDom.className = "panel panel-default"
    divDom.style = ""
    divDom.innerHTML = `
                <div class="panel-heading" style="background-color:white;" role="tab">
                    <h4 class="panel-title">
                        <a role="button" data-toggle="collapse" data-parent="#${parentid}" href="#collapse-${parentid}-${index}" aria-expanded="true">
                            ${span}
                            ${url}
                            <span class="pull-right text-primary">${title}<span>
                        </a>
                    </h4>
                </div>
                <div id="collapse-${parentid}-${index}" class="panel-collapse collapse" role="tabpanel">
                    <div class="panel-body">
                        <div class="row">
                            <form action="${url}" method="${method}" class="col-sm-7">
                                ${inputs}
                                <br>
                                <button type="button" class="btn btn-default btn-sm" onclick="tryApi(this.parentNode)">测试接口</button>
                            </form>
                            <div class="col-sm-5 text-info">${description}</div>
                        </div>
                        <br>
                    </div>
                </div>
            `
    return divDom
}

//获取input的HTML
function getInputHtml(name, description) {
    return `
        <div class="input-group" style="margin-bottom:10px;">
            <span class="input-group-addon input-sm">${name}</span>
            <input class="form-control input-sm" name="${name}" type="text">
            <span class="input-group-addon input-sm">${description}</span>
        </div>
        `
}

//获取文件INPUT
function getFileHtml(name, description, multiple = false) {
    return `
        <div class="input-group" style="margin-bottom:10px;">
            <span class="input-group-addon input-sm">${name}</span>
            <input placeholder="请选择文件" class="form-control input-sm" onclick="this.parentNode.children[2].click()">
            <input style="display:none" type="file" name="${name}" onchange="this.parentNode.children[1].value=this.value" multiple="${multiple}">
            <span class="input-group-addon input-sm">${description}</span>
        </div>
        `
}

//发送请求
function tryApi(form) {
    let temps = form.getElementsByTagName('input')
    let inputs = new Array()

    //过滤掉没有name的元素
    for (let i = 0; i < temps.length; i++) {
        if (!!temps[i].name) inputs.push(temps[i])
    }

    //获取文本元素
    let texts = new Array()
    for (let i = 0; i < inputs.length; i++) {
        if (inputs[i].type == 'text') texts.push(inputs[i])
    }

    //获取文件元素
    let files = new Array()
    for (let i = 0; i < inputs.length; i++) {
        if (inputs[i].type == 'file') files.push(inputs[i])
    }

    //如果请求是GET，忽略file
    if (form.getAttribute('method') == 'get') {
        let params = new Array()
        for (let i = 0; i < texts.length; i++) {
            params[texts[i].name] = texts[i].value
        }
        $.ajax({
            type: "get",
            url: getUrl(form.getAttribute('action'), params),
            success: function(res) { showSuccess(res) },
            headers: getHeader()
        }).fail(function(res) {
            showError(res.responseText)
        })
    }
    //如果是POST请求，表单提交
    else if (form.getAttribute('method') == 'post') {
        let formData = new FormData()
        for (let i = 0; i < texts.length; i++) {
            formData.append(texts[i].name, texts[i].value)
        }
        for (let i = 0; i < files.length; i++) {
            let fileDom = files[i]

            //单文件
            if (fileDom.multiple != true) {
                formData.append(fileDom.name, fileDom.files[0])
            }
            //多文件
            else {
                for (let j = 0; j < fileDom.files.length; j++) {
                    formData.append(fileDom.name, fileDom.files[j])
                }
            }
        }
        $.ajax({
            type: "POST",
            url: getUrl(form.getAttribute('action')),
            data: formData,
            processData: false,
            contentType: false,
            headers: getHeader()
        }).done(function(res) { showSuccess(res) }).fail(function(res) { showError(res.responseText) })
    }
    //如果是PUT请求
    else if (form.getAttribute('method') == 'put') {
        let params = new Array()
        for (let i = 0; i < texts.length; i++) {
            params[texts[i].name] = texts[i].value
        }
        $.ajax({ type: "put", url: getUrl(form.getAttribute('action'), params), success: function(res) { showSuccess(res) }, headers: getHeader() }).fail(function(res) { showError(res.responseText) })
    }
    //如果请求是DELETE
    else if (form.getAttribute('method') == 'delete') {
        let params = new Array()
        for (let i = 0; i < texts.length; i++) {
            params[texts[i].name] = texts[i].value
        }
        $.ajax({ type: "delete", url: getUrl(form.getAttribute('action'), params), success: function(res) { showSuccess(res) }, headers: getHeader() }).fail(function(res) { showError(res.responseText) })
    } else {
        console.error('request method error get\post\delete\delete')
    }
}

function getParams(params) {

    let query = new Array();

    for (let key in params) {

        query.push(key + "=" + params[key]);

    }

    return query.join('&');
}

function getUrl(url, params) {

    let paramsStr = getParams(params);

    return SERVER_URL + url + (paramsStr == '' ? paramsStr : '?' + paramsStr);
}

function syntaxHighlight(json) {
    if (typeof json != 'string') {
        json = JSON.stringify(json, undefined, 2);
    }
    json = json.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function(match) {
        var cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}

function showError(text) {
    //$('#error-pad').html(text)
    document.getElementById('error-pad').contentWindow.document.body.innerHTML = text;
    $('#myModal-2').modal('show')
}

function showSuccess(json) {
    console.log(json)
    $('#lg-pad').html(syntaxHighlight(json))
    $('#myModal').modal('show')
}

function loadHeaders(headers) {
    let headers_page = document.getElementById('headers-page')
    headers.forEach(function(e) {
        headers_page.innerHTML += getHeaderInput(e)
    })
}

function getHeaderInput(header) {
    return `
        <div class="input-group" style="margin-bottom:10px;">
            <span class="input-group-addon input-sm">${header}</span>
            <input class="form-control input-sm" name="${header}" type="text">
        </div>
    `
}

function setHeaders(form) {
    let inputs = form.getElementsByTagName('input')
    for (let i = 0; i < inputs.length; i++) {
        localStorage.setItem(inputs[i].name, inputs[i].value)
    }
}

function getHeader() {
    let headers = {}
    HEADERS_LIST.forEach(function(e) {
        headers[e] = localStorage.getItem(e)
    })
    return headers
}