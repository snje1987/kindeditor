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
            self.options = options;
            self.progressbars = {};
            // template
            self.div = K(options.container).html([
                '<div class="ke-swfupload">',
                '<div class="ke-swfupload-top">',
                '<div class="ke-inline-block" id="ke-swfupload-button">',
                options.selectButtonValue,
                '</div>',
                '<div class="ke-inline-block ke-swfupload-desc">' + options.uploadDesc + '</div>',
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
                pick: '#ke-swfupload-button',
                resize: false,
                formData: options.postParams,
                fileVal: options.filePostName,
                compress:false
            };
            self.swfu = new WebUploader.create(settings);
            self.swfu.on('fileQueued', function (file) {
                file.url = self.options.fileIconUrl;
                self.appendFile(file);
            });
            self.swfu.on('uploadStart', function (file) {
                var self = this;
                var itemDiv = K('div[data-id="' + file.id + '"]', self.bodyDiv);
                K('.ke-status > div', itemDiv).hide();
                K('.ke-progressbar', itemDiv).show();
            });
            self.swfu.on('uploadProgress', function (file, percentage) {
                var percent = parseInt(percentage * 100);
                var progressbar = self.progressbars[file.id];
                progressbar.bar.css('width', Math.round(percent * 80 / 100) + 'px');
                progressbar.percent.html(percent + '%');
            });
            self.swfu.on('uploadSuccess', function (file, data) {
                var itemDiv = K('div[data-id="' + file.id + '"]', self.bodyDiv).eq(0);
                if (data.error != 0) {
                    showError(itemDiv, self.options.errorMessage);
                    return;
                }
                file.url = data.url;
                K('.ke-img', itemDiv).attr('src', file.url).attr('data-status', 'complete').data('data', data);
                K('.ke-status > div', itemDiv).hide();
            });
            self.swfu.on('uploadError', function (file, reason) {
                var itemDiv = K('div[data-id="' + file.id + '"]', self.bodyDiv).eq(0);
                showError(itemDiv, self.options.errorMessage);
            });

            K('.ke-swfupload-startupload input', self.div).click(function () {
                self.swfu.upload();
            });
        },
        getUrlList: function () {
            var list = [];
            K('.ke-img', self.bodyDiv).each(function () {
                var img = K(this);
                var status = img.attr('data-status');
                if (status == 'complete') {
                    list.push(img.data('data'));
                }
            });
            return list;
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
                self.removeFile(K(this).attr('data-id'));
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

    K.swfupload = function (element, options) {
        return new KSWFUpload(element, options);
    };

})(KindEditor);

KindEditor.plugin('multiimage', function (K) {
    var self = this, name = 'multiimage',
            formatUploadUrl = K.undef(self.formatUploadUrl, true),
            uploadJson = K.undef(self.uploadJson, self.basePath + 'php/upload_json.php'),
            imgPath = self.pluginsPath + 'multiimage/images/',
            imageSizeLimit = K.undef(self.imageSizeLimit, '1MB'),
            imageFileTypes = K.undef(self.imageFileTypes, '*.jpg;*.gif;*.png'),
            imageUploadLimit = K.undef(self.imageUploadLimit, 20),
            filePostName = K.undef(self.filePostName, 'imgFile'),
            lang = self.lang(name + '.');

    self.plugin.multiImageDialog = function (options) {
        var clickFn = options.clickFn,
                uploadDesc = K.tmpl(lang.uploadDesc, {uploadLimit: imageUploadLimit, sizeLimit: imageSizeLimit});
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
                    clickFn.call(self, swfupload.getUrlList());
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

        var swfupload = K.swfupload({
            container: K('.swfupload', div),
            fileIconUrl: imgPath + 'image.png',
            uploadDesc: uploadDesc,
            selectButtonValue: lang.selectUpload,
            startButtonValue: lang.startUpload,
            uploadUrl: K.addParam(uploadJson, 'dir=image'),
            flashUrl: imgPath + 'swfupload.swf',
            filePostName: filePostName,
            fileTypes: '*.jpg;*.jpeg;*.gif;*.png;*.bmp',
            fileTypesDesc: 'Image Files',
            fileUploadLimit: imageUploadLimit,
            fileSizeLimit: imageSizeLimit,
            postParams: K.undef(self.extraFileUploadParams, {}),
            queueLimitExceeded: lang.queueLimitExceeded,
            fileExceedsSizeLimit: lang.fileExceedsSizeLimit,
            zeroByteFile: lang.zeroByteFile,
            invalidFiletype: lang.invalidFiletype,
            unknownError: lang.unknownError,
            pendingMessage: lang.pending,
            errorMessage: lang.uploadError,
            afterError: function (html) {
                self.errorDialog(html);
            }
        });

        return dialog;
    };
    self.clickToolbar(name, function () {
        self.plugin.multiImageDialog({
            clickFn: function (urlList) {
                if (urlList.length === 0) {
                    return;
                }
                K.each(urlList, function (i, data) {
                    if (self.afterUpload) {
                        self.afterUpload.call(self, data.url, data, 'multiimage');
                    }
                    self.exec('insertimage', data.url, data.title, data.width, data.height, data.border, data.align);
                });
                // Bugfix: [Firefox] 上传图片后，总是出现正在加载的样式，需要延迟执行hideDialog
                setTimeout(function () {
                    self.hideDialog().focus();
                }, 0);
            }
        });

    });
});
