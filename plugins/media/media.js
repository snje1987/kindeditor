/*******************************************************************************
 * KindEditor - WYSIWYG HTML Editor for Internet
 * Copyright (C) 2006-2011 kindsoft.net
 *
 * @author Roddy <luolonghao@gmail.com>
 * @site http://www.kindsoft.net/
 * @licence http://www.kindsoft.net/license.php
 *******************************************************************************/

KindEditor.plugin('media', function (K) {
    var self = this, name = 'media', lang = self.lang(name + '.'),
            allowMediaUpload = K.undef(self.allowMediaUpload, true),
            allowFileManager = K.undef(self.allowFileManager, false),
            formatUploadUrl = K.undef(self.formatUploadUrl, true),
            extraParams = K.undef(self.extraFileUploadParams, {}),
            filePostName = K.undef(self.filePostName, 'imgFile'),
            uploadJson = K.undef(self.uploadJson, self.basePath + 'php/upload_json.php');
    self.plugin.media = {
        edit: function () {
            var html = [
                '<div style="padding:20px;">',
                //url
                '<div class="ke-dialog-row">',
                '<label for="keUrl" style="width:60px;">' + lang.url + '</label>',
                '<input class="ke-input-text" type="text" id="keUrl" name="url" value="" style="width:160px;" /> &nbsp;',
                '<span class="ke-button-common ke-button-outer"><input type="button" data-target="url" name="upload" class="ke-button-common ke-button" value="' + lang.upload + '" /></span>&nbsp;',
                '<span class="ke-button-common ke-button-outer">',
                '<input type="button" class="ke-button-common ke-button" name="viewServer" data-target="url" value="' + lang.viewServer + '" />',
                '</span>',
                '</div>',
                //preload
                '<div class="ke-dialog-row">',
                '<label for="keUrl" style="width:60px;">' + lang.preload + '</label>',
                '<input class="ke-input-text" type="text" id="keUrl" name="preload" value="" style="width:160px;" /> &nbsp;',
                '<span class="ke-button-common ke-button-outer"><input type="button" data-target="preload" name="upload" class="ke-button-common ke-button" value="' + lang.upload + '" /></span>&nbsp;',
                '<span class="ke-button-common ke-button-outer">',
                '<input type="button" class="ke-button-common ke-button" data-target="preload" name="viewServer" value="' + lang.viewServer + '" />',
                '</span>',
                '</div>',
                //width
                '<div class="ke-dialog-row">',
                '<label for="keWidth" style="width:60px;">' + lang.width + '</label>',
                '<input type="text" id="keWidth" class="ke-input-text ke-input-number" name="width" value="550" maxlength="4" />',
                '</div>',
                //height
                '<div class="ke-dialog-row">',
                '<label for="keHeight" style="width:60px;">' + lang.height + '</label>',
                '<input type="text" id="keHeight" class="ke-input-text ke-input-number" name="height" value="400" maxlength="4" />',
                '</div>',
                //autostart
                '<div class="ke-dialog-row">',
                '<label for="keAutostart">' + lang.autostart + '</label>',
                '<input type="checkbox" id="keAutostart" name="autostart" value="" /> ',
                '</div>',
                '</div>'
            ].join('');
            var dialog = self.createDialog({
                name: name,
                width: 450,
                height: 250,
                title: self.lang(name),
                body: html,
                yesBtn: {
                    name: self.lang('yes'),
                    click: function (e) {
                        var url = K.trim(urlBox.val()),
                                preload = K.trim(preloadBox.val()),
                                width = widthBox.val(),
                                height = heightBox.val();
                        if (url == 'http://' || K.invalidUrl(url)) {
                            alert(self.lang('invalidUrl'));
                            urlBox[0].focus();
                            return;
                        }
                        if (preload == 'http://' || K.invalidUrl(preload)) {
                            alert(self.lang('invalidUrl'));
                            urlBox[0].focus();
                            return;
                        }
                        if (!/^\d*$/.test(width)) {
                            alert(self.lang('invalidWidth'));
                            widthBox[0].focus();
                            return;
                        }
                        if (!/^\d*$/.test(height)) {
                            alert(self.lang('invalidHeight'));
                            heightBox[0].focus();
                            return;
                        }
                        var attr = {
                            src: url,
                            preload: preload,
                            type: K.mediaType(url),
                            width: width,
                            height: height,
                            loop: 'true',
                            controls: 'true'
                        };
                        if (autostartBox[0].checked) {
                            attr.autoplay = '';
                        }
                        var html = K.mediaImg(self.themesPath + 'common/blank.gif', attr);
                        self.insertHtml(html).hideDialog().focus();
                    }
                }
            }),
                    div = dialog.div,
                    urlBox = K('[name="url"]', div),
                    preloadBox = K('[name="preload"]', div),
                    viewServerBtn = K('[name="viewServer"]', div),
                    widthBox = K('[name="width"]', div),
                    heightBox = K('[name="height"]', div),
                    autostartBox = K('[name="autostart"]', div);
            urlBox.val('http://');
            var uploadButton = K('[name="upload"]', div);
            preloadBox.val('http://');

            if (allowMediaUpload) {
                uploadButton.click(function (e) {
                    var target = K(e.target).attr('data-target');
                    self.loadPlugin('bigfile', function () {
                        self.plugin.bigfileDialog({
                            action: 'upload',
                            clickFn: function (file) {
                                if (self.dialogs.length > 1) {
                                    self.hideDialog();
                                    var url = file.url;
                                    if (formatUploadUrl) {
                                        url = K.formatUrl(url, 'absolute');
                                    }
                                    K('[name="' + target + '"]', div).val(url);
                                    if (self.afterUpload) {
                                        self.afterUpload.call(self, url, file, name);
                                    }
                                    //alert(self.lang('uploadSuccess'));
                                }
                            }
                        });
                    });
                });
            } else {
                K('.ke-upload-button', div).hide();
            }

            if (allowFileManager) {
                viewServerBtn.click(function (e) {
                    var target = K(e.target).attr('data-target');
                    self.loadPlugin('filemanager', function () {
                        self.plugin.filemanagerDialog({
                            viewType: 'LIST',
                            dirName: 'media',
                            clickFn: function (url, title) {
                                if (self.dialogs.length > 1) {
                                    K('[name="' + target + '"]', div).val(url);
                                    if (self.afterSelectFile) {
                                        self.afterSelectFile.call(self, url);
                                    }
                                    self.hideDialog();
                                }
                            }
                        });
                    });
                });
            } else {
                viewServerBtn.hide();
            }

            var img = self.plugin.getSelectedMedia();
            if (img) {
                var attrs = K.mediaAttrs(img.attr('data-ke-tag'));
                urlBox.val(attrs.src);
                preloadBox.val(attrs.preload);
                widthBox.val(K.removeUnit(img.css('width')) || attrs.width || 0);
                heightBox.val(K.removeUnit(img.css('height')) || attrs.height || 0);
                autostartBox[0].checked = (typeof attrs.autoplay !== 'undefined');
            }
            urlBox[0].focus();
            urlBox[0].select();
        },
        'delete': function () {
            self.plugin.getSelectedMedia().remove();
            // [IE] 删除图片后立即点击图片按钮出错
            self.addBookmark();
        }
    };
    self.clickToolbar(name, self.plugin.media.edit);
});
