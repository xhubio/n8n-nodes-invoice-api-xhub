import type { IExecuteFunctions, ILoadOptionsFunctions, INodeExecutionData, INodeListSearchResult, INodeType, INodeTypeDescription } from 'n8n-workflow';
export declare class InvoiceXhub implements INodeType {
    description: INodeTypeDescription;
    methods: {
        listSearch: {
            searchCountries(this: ILoadOptionsFunctions, filter?: string): Promise<INodeListSearchResult>;
            searchFormats(this: ILoadOptionsFunctions, filter?: string): Promise<INodeListSearchResult>;
        };
    };
    execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]>;
}
//# sourceMappingURL=InvoiceXhub.node.d.ts.map