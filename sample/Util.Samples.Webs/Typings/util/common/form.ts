﻿//============== 表单操作 ========================
//Copyright 2018 何镇汐
//Licensed under the MIT license
//================================================
import { NgForm } from '@angular/forms';
import { FailResult } from '../core/result';
import { ViewModel } from '../core/model';
import { HttpMethod } from '../angular/http-helper';
import { WebApi } from './webapi';
import { RouterHelper } from '../angular/router-helper';
import { Message } from './message';
import { MessageConfig } from '../config/message-config';
import { Dialog } from './dialog';

/**
 * 表单操作
 */
export class Form {
    /**
     * 提交表单
     * @param options 表单提交参数
     */
    submit(options: IFormSubmitOption): void {
        this.initSubmit(options);
        if (!this.validateSubmit(options)) {
            options["fnComplete"]();
            return;
        }
        if (!this.submitBefore(options)) {
            options["fnComplete"]();
            return;
        }
        if (!options.confirm) {
            this.submitForm(options);
            return;
        }
        Message.confirm({
            title: options.confirmTitle,
            message: options.confirm,
            ok: () => this.submitForm(options),
            cancel: options["fnComplete"]
        });
    }

    /**
     * 提交表单初始化
     */
    private initSubmit(options: IFormSubmitOption) {
        if (!options)
            return;
        options["fnComplete"] = () => {
            if (options.form)
                (options.form as { submitted: boolean }).submitted = false;
            options.completeHandler && options.completeHandler();
        };
    }

    /**
     * 提交表单验证
     */
    private validateSubmit(options: IFormSubmitOption) {
        if (!options) {
            Message.error("表单参数[options: FormSubmitOptions]未设置");
            return false;
        }
        if (!options.url) {
            Message.error("表单url未设置");
            return false;
        }
        if (!options.form) {
            Message.error("表单ngForm未设置");
            return false;
        }
        if (!options.data) {
            Message.error("表单数据未设置");
            return false;
        }
        return true;
    }

    /**
     * 提交前操作
     */
    private submitBefore(options: IFormSubmitOption) {
        if (!options.beforeHandler)
            return true;
        return options.beforeHandler();
    }

    /**
     * 提交表单
     */
    private submitForm(options: IFormSubmitOption) {
        if (!options.httpMethod) {
            options.httpMethod = options.data.id ? HttpMethod.Put : HttpMethod.Post;
        }
        WebApi.send(options.url, options.httpMethod, options.data).header(options.header).handle({
            handler: result => {
                this.submitHandler(options, result);
            },
            failHandler: options.failHandler,
            completeHandler: options["fnComplete"]
        });
    }

    /**
     * 提交表单成功处理函数
     */
    private submitHandler(options: IFormSubmitOption, result) {
        options.handler && options.handler(result);
        if (options.showMessage !== false)
            Message.snack(MessageConfig.successed);
        if (options.back)
            RouterHelper.back();
        if (options.closeDialog)
            Dialog.close();
    }
}

/**
 * 表单提交参数
 */
export interface IFormSubmitOption {
    /**
     * 表单
     */
    form: NgForm;
    /**
     * 请求地址
     */
    url: string;
    /**
     * 提交数据
     */
    data: ViewModel;
    /**
     * Http头
     */
    header?: { name: string, value }[];
    /**
     * Http方法
     */
    httpMethod?: HttpMethod;
    /**
     * 确认消息,设置该项则提交前需要确认
     */
    confirm?: string;
    /**
     * 确认标题
     */
    confirmTitle?: string;
    /**
     * 提交成功后是否显示成功提示，默认为true
     */
    showMessage?: boolean;
    /**
     * 提交成功后是否返回上一个视图，默认为false
     */
    back?: boolean;
    /**
     * 提交成功后是否关闭弹出层，当在弹出层中编辑时使用，默认为false
     */
    closeDialog?: boolean;
    /**
     * 提交前处理函数，返回false则取消提交
     */
    beforeHandler?: () => boolean;
    /**
     * 提交成功处理函数
     */
    handler?: (result) => void;
    /**
     * 提交失败处理函数
     */
    failHandler?: (result: FailResult) => void;
    /**
     * 操作完成处理函数，注意：该函数在任意情况下都会执行
     */
    completeHandler?: () => void;
}