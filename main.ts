
import * as fs from 'fs'
import * as acorn from 'acorn';
import * as walk from 'acorn/dist/walk';


class PatchInfo {
    node: any       // 语法树节点
    head: boolean  // 是否是开头
    pos: number       // 需要插入内容的位置
    cnt: number

    constructor(node, head, pos, cnt) {
        this.node = node;
        this.head = head
        this.pos = pos;
        this.cnt = cnt
    }
}
class PatchWorker {

    // 由小到大排序
    _patchInfo: PatchInfo[] = []
    // 源码
    source: string

    constructor(source: string) {
        this.source = source
    }

    _push(node, head, pos, cnt) {

        let idx = this._patchInfo.length
        for (let i = 0; i < this._patchInfo.length; i++) {
            if (pos < this._patchInfo[i].pos) {
                idx = i
                break
            }
        }

        this._patchInfo.splice(idx, 0, new PatchInfo(node, head, pos, cnt))
    }

    doPatch(): string {

        let ast = acorn.parse(this.source)
        walk.full(ast, (node, state, type) => {

            if (type == 'FunctionExpression' || type == 'FunctionDeclaration') {
                // 只给函数和函数表达式打补丁。
            } else {
                return
            }

            let cnt = (node.body.end - node.body.start) / 100
            this._push(node, true, node.body.start, cnt)
            this._push(node, false, node.body.end, cnt)
        })


        // 开始打补丁
        let modify = '';

        let patchBegin = ';var xxxx = 0; xxxx += 1;'
        let patchEnd = ';xxxx += 1;'

        let last = 0
        for (let i = 0; i < this._patchInfo.length; i++) {
            let it = this._patchInfo[i]
            let node = it.node
            let source = this.source

            if (it.head) {

                // 在括号之后打补丁
                modify += source.substr(last, it.pos + 1 - last)
                last = it.pos + 1

                let cnt = 0;
                while (cnt < it.cnt) {
                    modify += patchBegin
                    cnt++;
                }
            } else {
                modify += source.substr(last, it.pos - 1 - last)
                last = it.pos - 1

                // 在括号之前打补丁
                let cnt = 0;
                while (cnt < it.cnt) {
                    modify += patchEnd
                    cnt++;
                }

                modify += source.substr(last, 1)
                last += 1
            }
        }

        // 剩余的内容
        modify += this.source.substr(last, this.source.length - last)

        return modify
    }
}



function main() {
    console.log("开始")
    let path2 = 'C:\\Users\\liubo\\liubo\\gitee\\ilovehue-full\\ilovehue\\build\\wechatgame\\src\\'
    let data = fs.readFileSync(path2 + 'project2.js');
    let output = path2 + 'project.js'

    if (false) {
        data = fs.readFileSync('./main.js')
    }

    // console.log("文件内容：", data.toString())

    console.log("抽象语法树：")
    let source = data.toString()
    let worker = new PatchWorker(source)
    // console.log(ast)

    console.log("walk.simple")

    let modify = worker.doPatch();

    fs.writeFileSync(output, modify)
}


main()
