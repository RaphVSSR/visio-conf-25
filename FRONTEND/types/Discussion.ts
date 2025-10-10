import { User } from './User';
  
  export interface Discussion {
    discussion_uuid: string;
    discussion_type?: string;
    discussion_name?: string;
    discussion_members: {
        _id?: string;
        id?: string;
        email: string;
        firstname: string;
        lastname: string;
    }[];
    last_message?: {
        message_content: string;
        message_date_create: string;
    };
  }
