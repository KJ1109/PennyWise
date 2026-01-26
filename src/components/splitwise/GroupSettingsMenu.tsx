'use client'

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { MoreVertical, LogOut, Trash2 } from 'lucide-react'
import { deleteGroup, leaveGroup } from '@/app/actions/splitwise'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function GroupSettingsMenu({
    groupId,
    isCreator
}: {
    groupId: string
    isCreator: boolean
}) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to DELETE this group? This action helps no one and cannot be undone.')) return

        setLoading(true)
        const res = await deleteGroup(groupId)
        setLoading(false)

        if (res?.error) {
            alert(res.error)
        } else {
            router.push('/splitwise')
            router.refresh()
        }
    }

    const handleLeave = async () => {
        if (!confirm('Are you sure you want to leave this group?')) return

        setLoading(true)
        const res = await leaveGroup(groupId)
        setLoading(false)

        if (res?.error) {
            alert(res.error)
        } else {
            router.push('/splitwise')
            router.refresh()
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" disabled={loading}>
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Group Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />

                {isCreator ? (
                    <DropdownMenuItem
                        className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                        onClick={handleDelete}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Group
                    </DropdownMenuItem>
                ) : (
                    <DropdownMenuItem
                        className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                        onClick={handleLeave}
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Leave Group
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
