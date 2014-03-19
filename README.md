# ANNO

![](http://ww4.sinaimg.cn/small/6143ba6fjw1eel7jb3eolj203k03kjr8.jpg)

## 豆瓣读书笔记第三方客户端

这是一个基于Angular开发的Chrome App，可以独立安装在系统中。下载地址：[]()

## 基本功能

读书笔记的管理，写作，收藏，导出。

## 参与开发

ANNO是一个开源的应用，目前基本支持了豆瓣的 OAuth2 读书笔记读写 API，还有以下功能正在开发：

* 加入数学公式支持
* 带格式导出笔记到Evernote
* ……

### 开发准备

以下操作都在项目目录下执行

* `npm install` 安装 Grunt 等依赖
* `bower install` 安装前端使用的库文件(如果不需要使用到新的库文件，这一步和下一步可以忽略)
* 将`bower_components/`中所需文件移到 `assets/lib/`中
* 开发时`grunt watch`，`assets/`下的文件编译、压缩到`public/`中。

在Chrome扩展中加载项目目录，开启应用调试。

## 鼓励

如果你觉得这个App对你有帮助，欢迎以各种形式送我几本书看，非常感谢。

* [心愿书单](http://book.douban.com/doulist/3639007/)

* [https://me.alipay.com/simonday](https://me.alipay.com/simonday)

欢迎关注我的豆瓣: [阿弟](http://www.douban.com/people/sensitive/)。
