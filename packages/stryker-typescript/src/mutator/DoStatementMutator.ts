import * as ts from 'typescript';
import NodeMutator, { NodeReplacement } from './NodeMutator';

export default class DoStatementMutator extends NodeMutator<ts.DoStatement> {

  name = 'DoStatement';

  guard(node: ts.Node): node is ts.DoStatement {
    return node.kind === ts.SyntaxKind.DoStatement;
  }

  protected identifyReplacements(node: ts.DoStatement, sourceFile: ts.SourceFile): NodeReplacement[] {
    return [{ node: node.expression, replacement: 'false' }];
  }

}