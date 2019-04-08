import config from "./config/config";

export interface HttpParamsMap { [key: string]: any };
export interface HttpResponseHanler { (response: HttpResponse) };
export interface HttpResponse { seq: number, request: string, event: string, data: string };

export default class HttpManager {

    private SEQ: number = 1;// SEQ请求标记,递增

    private HTTP_HOST: string = config.HTTP_HOST; // HTTP请求地址

    private static _instance: HttpManager;

    private constructor() {
    }


    /**
     * 获取HttpManager单例
     * @param url socket连接地址
     */
    public static instance() {
        if (HttpManager._instance == null) {
            HttpManager._instance = new HttpManager();
        }
        return HttpManager._instance;
    }


    /**
     * HTTP_GET请求
     * @param url 请求地址
     * @param params 请求参数
     * @param handler 请求回调
     */
    public HTTP_GET(url: string, params: HttpParamsMap, handler: HttpResponseHanler) {
        let seq = this.SEQ++;
        let xhr = cc.loader.getXMLHttpRequest();
        xhr.withCredentials = true;
        url = this.HTTP_HOST + url + this.encode("GET", params)
        xhr.open("GET", url, true);
        if (cc.sys.isNative) xhr.setRequestHeader("Accept-Encoding", "gzip,deflate");
        xhr.timeout = 5000;
        xhr.send();
        this.registerScriptHandler(seq, xhr, handler, url, "GET", params);
    }


    /**
     * HTTP_POST请求
     * @param url 请求地址
     * @param params 请求参数
     * @param handler 请求回调
     */
    public HTTP_POST(url: string, params: HttpParamsMap, handler: HttpResponseHanler) {
        let seq = this.SEQ++;
        var xhr = cc.loader.getXMLHttpRequest();
        url = this.HTTP_HOST + url
        xhr.withCredentials = true;
        xhr.open("POST", url);
        xhr.setRequestHeader("Content-Type", "text/plain");
        xhr.timeout = 5000;
        xhr.send(this.encode("POST", params));
        this.registerScriptHandler(seq, xhr, handler, url, "POST", params);
    }


    /**
     * 将参数变为字符串
     * @param params 请求参数
     */
    private encode(requestType, params: HttpParamsMap): any {
        if (params == null) return "";
        let paramStr = "";
        for (const key in params) {
            if (params.hasOwnProperty(key)) {
                paramStr = paramStr + key + "=" + params[key] + "&"
            }
        }
        if (requestType == "GET") {
            return "?" + params
        }
        return paramStr;
    }


    /**
     * 注册网络请求事件回调
     * @param seq 请求sequence标记，递增
     * @param xhr xhr实例
     * @param handler 请求回调
     * @param url 网络请求地址
     * @param method 请求类型 GET POST
     * @param data 请求数据
     */
    private registerScriptHandler(seq, xhr, handler, url, method, data) {
        // 打印请求
        // console.info("【请求】【SEQ_%d】【%s】【%s】PARAMS=", seq, method, url, data)
        // 默认回调
        handler = handler || function (response: HttpResponse) {
            // console.warn("【警告】你还没有为当前请求'【SEQ_%d】【%s】'设置回调函数！", seq, method)
        };
        // 失败和超时回调
        ['loadstart', 'abort', 'error', 'load', 'loadend', 'timeout'].forEach(function (eventname) {
            xhr["on" + eventname] = function () {
                if (eventname == "error" || eventname == "timeout") {
                    let response = { seq: seq, request: method, event: eventname.toLocaleUpperCase(), data: xhr.responseText }
                    // console.error("【结果】【SEQ_%d】【%s】【%s】RESPONSE=%s", seq, method, response.event, response.data)
                    handler(response);
                }
            };
        });
        // 请求成功回调
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status >= 200) {
                let response: HttpResponse = { seq: seq, request: method, event: "SUCCESS", data: xhr.responseText }
                // console.info("【结果】【SEQ_%d】【%s】【%s】RESPONSE=%s", seq, method, response.event, response.data)
                handler(response);
            }
        };
    }

}


