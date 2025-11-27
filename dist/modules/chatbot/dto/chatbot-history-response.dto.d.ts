export declare class ChatbotMessageItemDto {
    _id: string;
    role: string;
    content: string;
    imageUrl?: string;
    imagePrompt?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare class ChatbotHistoryResponseDto {
    messages: ChatbotMessageItemDto[];
    total: number;
}
