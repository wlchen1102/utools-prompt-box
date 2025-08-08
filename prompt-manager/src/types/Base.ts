/**
 * 基础数据模型定义
 */

// 所有数据库文档的基础接口
export interface BaseDoc {
  _id: string;
  _rev?: string;
}
