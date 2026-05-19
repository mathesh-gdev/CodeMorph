import * as acorn from 'acorn';

export interface CodeMetadata {
  functions: string[];
  imports: string[];
  classes: string[];
  complexity: number;
  hierarchy: string;
}

export function analyzeStructure(code: string): CodeMetadata {
  const metadata: CodeMetadata = {
    functions: [],
    imports: [],
    classes: [],
    complexity: 0,
    hierarchy: '',
  };

  try {
    const ast = acorn.parse(code, {
      ecmaVersion: 'latest',
      sourceType: 'module',
    }) as any;

    const traverse = (node: any) => {
      if (!node) return;

      switch (node.type) {
        case 'FunctionDeclaration':
          metadata.functions.push(node.id?.name || 'anonymous');
          metadata.complexity++;
          break;
        case 'ClassDeclaration':
          metadata.classes.push(node.id?.name || 'anonymous');
          break;
        case 'ImportDeclaration':
          metadata.imports.push(node.source.value);
          break;
        case 'IfStatement':
        case 'ForStatement':
        case 'WhileStatement':
        case 'SwitchCase':
          metadata.complexity++;
          break;
      }

      for (const key in node) {
        if (node[key] && typeof node[key] === 'object') {
          if (Array.isArray(node[key])) {
            node[key].forEach(traverse);
          } else {
            traverse(node[key]);
          }
        }
      }
    };

    traverse(ast);
  } catch (e) {
    console.warn("AST Parsing failed, falling back to simple analysis", e);
  }

  return metadata;
}
