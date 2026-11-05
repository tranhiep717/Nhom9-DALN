import Queue, { QueuePageProps } from '@/Pages/Receptionist/Queue';
import { adminNavItems } from '@/constants/navigation';

export default function AdminQueue(props: QueuePageProps) {
    return (
        <Queue
            {...props}
            role="admin"
            navItems={adminNavItems}
            queueUrl="/admin/queue"
            deskUrl="/admin/reception"
        />
    );
}
