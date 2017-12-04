/*******************************************************************************
 * KindEditor - WYSIWYG HTML Editor for Internet
 * Copyright (C) 2006-2011 kindsoft.net
 *
 * @author Roddy <luolonghao@gmail.com>
 * @site http://www.kindsoft.net/
 * @licence http://www.kindsoft.net/license.php
 *******************************************************************************/

(function (K) {

    function KSWFUpload(options) {
        this.init(options);
    }
    K.extend(KSWFUpload, {
        init: function (options) {
            var self = this;
            options.afterError = options.afterError || function (str) {
                alert(str);
            };
            var deepCopy = function (source) {
                var result = {};
                for (var key in source) {
                    result[key] = typeof source[key] === 'object' ? deepCoyp(source[key]) : source[key];
                }
                return result;
            };
            self.options = options;
            self.progressbars = {};
            // template
            self.div = K(options.container).html([
                '<div class="ke-swfupload">',
                '<div class="ke-swfupload-top">',
                '<div class="ke-inline-block" id="ke-swfupload-button">',
                options.selectButtonValue,
                '</div>',
                '<div class="ke-inline-block ke-swfupload-desc"></div>',
                '<span class="ke-button-common ke-button-outer ke-swfupload-startupload">',
                '<input type="button" class="ke-button-common ke-button" value="' + options.startButtonValue + '" />',
                '</span>',
                '</div>',
                '<div class="ke-swfupload-body"></div>',
                '</div>'
            ].join(''));
            self.bodyDiv = K('.ke-swfupload-body', self.div);

            function showError(itemDiv, msg) {
                K('.ke-status > div', itemDiv).hide();
                K('.ke-message', itemDiv).addClass('ke-error').show().html(K.escape(msg));
            }

            var settings = {
                swf: options.basePath + '/plugins/multiimage/images/Uploader.swf',
                server: options.uploadUrl,
                resize: false,
                formData: options.postParams,
                fileVal: options.filePostName,
                compress: false,
                chunked: true,
                chunkSize: 1048576,
                fileNumLimit: 1,
                pick: {
                    id: '#ke-swfupload-button',
                    multiple: false
                }
            };
            if (typeof WebUploader.Uploader.big_reg === 'undefined') {
                WebUploader.Uploader.register({
                    "before-send": "beforeSend"
                }, {
                    beforeSend: function (block) {
                        var deferred = WebUploader.Deferred();
                        if(typeof block.file.bchunk === 'undefined'){
                            deferred.resolve();
                            return deferred.promise();
                        }
                        var chunk = block.file.bchunk;
                        if (chunk < 0) {
                            self.swfu.reset();
                        }
                        if (block.chunk >= chunk) {
                            deferred.resolve();
                        } else {
                            deferred.reject();
                        }
                        this.owner.options.formData.file_id = block.file.file_id;
                        this.owner.options.formData.action = 'chunk';
                        return deferred.promise();
                    }
                });
                WebUploader.Uploader.big_reg = true;
            }
            self.swfu = new WebUploader.create(settings);
            self.swfu.on('fileQueued', function (file) {
                file.url = self.options.fileIconUrl;
                self.appendFile(file);
            });
            self.swfu.on('uploadStart', function (file) {
                var parm = deepCopy(options.postParams);
                if (options.action == 'resume') {
                    parm['file_id'] = options.file_id;
                }
                parm['filename'] = file.name;
                parm['filesize'] = file.size;
                parm['action'] = 'init';
                $.ajax({
                    type: "POST",
                    url: options.uploadUrl,
                    data: parm,
                    cache: false,
                    async: false,
                    timeout: 1000,
                    dataType: "json",
                    success: function (data) {
                        if (data.error != 0) {
                            file.bchunk = -1;
                            var itemDiv = K('div[data-id="' + file.id + '"]', self.bodyDiv);
                            showError(itemDiv, data.msg);
                            K('.ke-img', itemDiv).attr('data-status', 'error');
                        } else {
                            file.file_id = data.id;
                            file.bchunk = data.chunk;
                            var itemDiv = K('div[data-id="' + file.id + '"]', self.bodyDiv);
                            K('.ke-status > div', itemDiv).hide();
                            K('.ke-progressbar', itemDiv).show();
                        }
                    }
                });
            });
            self.swfu.on('uploadProgress', function (file, percentage) {
                var percent = parseInt(percentage * 100);
                var progressbar = self.progressbars[file.id];
                progressbar.bar.css('width', Math.round(percent * 80 / 100) + 'px');
                progressbar.percent.html(percent + '%');
            });
            self.swfu.on('uploadSuccess', function (file, data) {
                var itemDiv = K('div[data-id="' + file.id + '"]', self.bodyDiv).eq(0);
                K('.ke-status .ke-message', itemDiv).show();
                K('.ke-progressbar', itemDiv).hide();
                K('.ke-status .ke-message', itemDiv).html(self.options.checking);
                var img = K('.ke-img', itemDiv);

                self.swfu.md5File(file).then(function (val) {
                    var parm = deepCopy(options.postParams);
                    parm['action'] = 'check';
                    parm['file_id'] = file.file_id;
                    parm['filesize'] = file.size;
                    parm['md5'] = val;
                    $.ajax({
                        type: "POST",
                        url: options.uploadUrl,
                        data: parm,
                        cache: false,
                        async: false,
                        timeout: 1000,
                        dataType: "json",
                        success: function (data) {
                            if (data.error != 0) {
                                img.attr('data-status', 'error');
                                showError(itemDiv, data.msg);
                            } else {
                                img.attr('data-status', 'complete').data('data', data);
                                K('.ke-status .ke-message', itemDiv).html(self.options.succeed);
                            }
                            self.swfu.reset();
                        }
                    });
                });
            });
            self.swfu.on('uploadError', function (file, reason) {
                var itemDiv = K('div[data-id="' + file.id + '"]', self.bodyDiv).eq(0);
                showError(itemDiv, self.options.errorMessage);
            });

            K('.ke-swfupload-startupload input', self.div).click(function () {
                self.swfu.upload();
            });
        },
        getFile: function () {
            var file = {};
            K('.ke-img', self.bodyDiv).each(function () {
                var img = K(this);
                var status = img.attr('data-status');
                if (status == 'complete') {
                    file = img.data('data');
                }
            });
            return file;
        },
        removeFile: function (fileId) {
            var self = this;
            self.swfu.removeFile(fileId);
            var itemDiv = K('div[data-id="' + fileId + '"]', self.bodyDiv);
            K('.ke-photo', itemDiv).unbind();
            K('.ke-delete', itemDiv).unbind();
            itemDiv.remove();
        },
        removeFiles: function () {
            var self = this;
            K('.ke-item', self.bodyDiv).each(function () {
                var stat = K('.ke-img', K(this)).attr('data-status');
                if(stat == 'pending'){
                    self.removeFile(K(this).attr('data-id'));
                }
            });
        },
        appendFile: function (file) {
            var self = this;
            var itemDiv = K('<div class="ke-inline-block ke-item" data-id="' + file.id + '"></div>');
            self.bodyDiv.append(itemDiv);
            var photoDiv = K('<div class="ke-inline-block ke-photo"></div>')
                    .mouseover(function (e) {
                        K(this).addClass('ke-on');
                    })
                    .mouseout(function (e) {
                        K(this).removeClass('ke-on');
                    });
            itemDiv.append(photoDiv);

            var img = K('<img src="' + file.url + '" class="ke-img" data-status="' + file.filestatus + '" width="80" height="80" alt="' + file.name + '" />');
            photoDiv.append(img);
            K('<span class="ke-delete"></span>').appendTo(photoDiv).click(function () {
                self.removeFile(file.id);
            });
            var statusDiv = K('<div class="ke-status"></div>').appendTo(photoDiv);
            // progressbar
            K(['<div class="ke-progressbar">',
                '<div class="ke-progressbar-bar"><div class="ke-progressbar-bar-inner"></div></div>',
                '<div class="ke-progressbar-percent">0%</div></div>'].join('')).hide().appendTo(statusDiv);
            // message
            K('<div class="ke-message">' + self.options.pendingMessage + '</div>').appendTo(statusDiv);

            itemDiv.append('<div class="ke-name">' + file.name + '</div>');

            self.progressbars[file.id] = {
                bar: K('.ke-progressbar-bar-inner', photoDiv),
                percent: K('.ke-progressbar-percent', photoDiv)
            };
        },
        remove: function () {
            this.removeFiles();
            this.swfu.destroy();
            this.div.html('');
        }
    });

    K.bigupload = function (element, options) {
        return new KSWFUpload(element, options);
    };

})(KindEditor);

KindEditor.plugin('bigfile', function (K) {
    var self = this;
    var name = 'bigfile';
    var formatUploadUrl = K.undef(self.formatUploadUrl, true);
    var uploadJson = K.undef(self.uploadJson, self.basePath + 'php/upload_json.php');
    var filePostName = K.undef(self.filePostName, 'imgFile');
    var lang = self.lang(name + '.');
    var imgPath = self.pluginsPath + 'filemanager/images/';

    self.plugin.bigfileDialog = function (options) {
        var clickFn = options.clickFn;
        var html = [
            '<div style="padding:20px;">',
            '<div class="swfupload">',
            '</div>',
            '</div>'
        ].join('');
        var dialog = self.createDialog({
            name: name,
            width: 650,
            height: 510,
            title: self.lang(name),
            body: html,
            previewBtn: {
                name: lang.insertAll,
                click: function (e) {
                    clickFn.call(self, swfupload.getFile());
                }
            },
            yesBtn: {
                name: lang.clearAll,
                click: function (e) {
                    swfupload.removeFiles();
                }
            },
            beforeRemove: function () {
                // IE9 bugfix: https://github.com/kindsoft/kindeditor/issues/72
                if (!K.IE || K.V <= 8) {
                    swfupload.remove();
                }
            }
        }),
                div = dialog.div;

        var option = {
            container: K('.swfupload', div),
            fileIconUrl: imgPath + 'file-64.gif',
            selectButtonValue: lang.selectUpload,
            startButtonValue: lang.startUpload,
            uploadUrl: K.addParam(uploadJson, 'dir=image'),
            filePostName: filePostName,
            postParams: K.undef(self.extraFileUploadParams, {}),
            uploading: lang.uploading,
            checking: lang.checking,
            pendingMessage: lang.pending,
            errorMessage: lang.uploadError,
            succeed: lang.succeed,
            afterError: function (html) {
                self.errorDialog(html);
            }
        };

        if (options.action == 'resume') {
            option.file_id = options.file_id;
            option.action = 'resume';
        } else {
            option.action = 'upload';
        }

        var swfupload = K.bigupload(option);

        return dialog;
    };
    if (typeof WebUploader === 'undefined') {
        var HEAD = document.getElementsByTagName("head").item(0) || document.documentElement;
        var script = document.createElement("script");
        script.setAttribute("type", "text/javascript");
        script.setAttribute('src', self.basePath + '/plugins/multiimage/images/webuploader.js');
        HEAD.appendChild(script);
    }
});
