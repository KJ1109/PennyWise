'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Users, Trash2, X } from 'lucide-react'
import { removeGroupMember } from '@/app/actions/splitwise'
import { useRouter } from 'next/navigation'

export function ManageMembersDialog({
    members,
    groupId,
    currentUserId,
    isCreator
}: {
    members: any[]
    groupId: string
    currentUserId: string
    isCreator: boolean
}) {
    const [isOpen, setIsOpen] = useState(false)
    const [loadingId, setLoadingId] = useState<string | null>(null)
    const router = useRouter()

    const handleRemove = async (memberId: string, memberType: 'user' | 'manual', memberName: string) => {
        if (!confirm(`Are you sure you want to remove ${memberName}? This action cannot be undone.`)) return

        setLoadingId(memberId)
        const res = await removeGroupMember(groupId, memberId, memberType)
        setLoadingId(null)

        if (res?.error) {
            alert(res.error)
        } else {
            // Success
            router.refresh()
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Users className="h-4 w-4" />
                    {members.length} Members
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Group Members</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                        {isCreator
                            ? "As the creator, you can remove members who have settled their debts."
                            : "Contact the group creator to remove members."}
                    </div>
                    <div className="divide-y rounded-md border">
                        {members.map((member) => (
                            <div key={member.id} className="flex items-center justify-between p-3">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold text-xs">
                                        {member.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">{member.name}</span>
                                        <span className="text-xs text-muted-foreground capitalize">{member.type}</span>
                                    </div>
                                </div>

                                {isCreator && member.id !== currentUserId && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600"
                                        disabled={loadingId === member.id}
                                        onClick={() => handleRemove(member.id, member.type, member.name)}
                                        title="Remove member"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                                {isCreator && member.id === currentUserId && (
                                    <span className="text-xs text-muted-foreground px-2">Owner</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
