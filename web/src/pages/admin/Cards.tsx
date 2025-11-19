import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService, Card } from '../../services/admin.service';
import { useState } from 'react';
import Layout from '../../components/Layout';
import { Card as UICard, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { CreditCard, Plus, Edit2, Trash2, Sparkles, Image as ImageIcon, Tag } from 'lucide-react';

export default function CardsPage() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);

  const { data: cards, isLoading } = useQuery({
    queryKey: ['cards'],
    queryFn: () => adminService.getCards(),
  });

  const createMutation = useMutation({
    mutationFn: (data: Omit<Card, 'id'>) => adminService.createCard(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      setShowCreateModal(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Card> }) =>
      adminService.updateCard(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      setEditingCard(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteCard(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-muted-foreground animate-pulse">Loading...</div>
        </div>
      </Layout>
    );
  }

  const rarityColors: Record<string, string> = {
    common: 'from-gray-500 to-gray-600',
    rare: 'from-blue-500 to-blue-600',
    epic: 'from-purple-500 to-purple-600',
    legendary: 'from-amber-500 to-amber-600',
  };

  const getRarityColor = (rarity: string) => {
    return rarityColors[rarity] || rarityColors.common;
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Wisdom Cards</h1>
            <p className="text-muted-foreground mt-2">
              Manage collectible wisdom cards for your learners
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Card
          </Button>
        </div>

        {/* Cards Grid */}
        {cards && cards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {cards.map((card: Card) => (
              <CardCard
                key={card.id}
                card={card}
                rarityColor={getRarityColor(card.rarity)}
                onEdit={setEditingCard}
                onDelete={(id) => {
                  if (confirm('Are you sure you want to delete this card?')) {
                    deleteMutation.mutate(id);
                  }
                }}
              />
            ))}
          </div>
        ) : (
          <UICard>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No cards yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Get started by creating your first wisdom card
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Card
              </Button>
            </CardContent>
          </UICard>
        )}

        {/* Create/Edit Modal */}
        <Dialog
          open={showCreateModal || !!editingCard}
          onOpenChange={(open) => {
            if (!open) {
              setShowCreateModal(false);
              setEditingCard(null);
            }
          }}
        >
          <DialogContent onClose={() => {
            setShowCreateModal(false);
            setEditingCard(null);
          }}>
            <DialogHeader>
              <DialogTitle>{editingCard ? 'Edit Card' : 'Create Card'}</DialogTitle>
            </DialogHeader>
            <CardModal
              card={editingCard || undefined}
              onClose={() => {
                setShowCreateModal(false);
                setEditingCard(null);
              }}
              onSave={(data) => {
                if (editingCard) {
                  updateMutation.mutate({ id: editingCard.id, data });
                } else {
                  createMutation.mutate(data);
                }
              }}
              isLoading={createMutation.isPending || updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

function CardCard({
  card,
  rarityColor,
  onEdit,
  onDelete,
}: {
  card: Card;
  rarityColor: string;
  onEdit: (card: Card) => void;
  onDelete: (id: string) => void;
}) {
  // Format unlock condition for display
  const formatUnlockCondition = (condition: string | null) => {
    if (!condition) return null;
    try {
      const parsed = typeof condition === 'string' ? JSON.parse(condition) : condition;
      if (parsed.type === 'first_lesson') return 'Complete first lesson';
      if (parsed.type === 'streak') return `Maintain ${parsed.days || 7}-day streak`;
      if (parsed.type === 'perfect_quiz') return 'Get perfect score on quiz';
      if (parsed.type === 'xp_milestone') return `Reach ${parsed.xp || 1000} XP`;
      if (parsed.type === 'lesson_completion') return `Complete lesson ${parsed.lessonId || ''}`;
      return JSON.stringify(parsed);
    } catch {
      return condition;
    }
  };

  const unlockText = formatUnlockCondition(card.unlockCondition);

  return (
    <UICard className="hover:shadow-xl transition-all duration-300 group overflow-hidden border-2 hover:border-primary/20">
      {/* Card Image */}
      {card.imageUrl ? (
        <div className="relative h-56 w-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
          <img
            src={card.imageUrl}
            alt={card.nameEn}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <div className={`absolute top-3 right-3 bg-gradient-to-br ${rarityColor} text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm`}>
            {card.rarity.toUpperCase()}
          </div>
        </div>
      ) : (
        <div className="relative h-56 w-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
          <ImageIcon className="h-16 w-16 text-slate-400" />
          <div className={`absolute top-3 right-3 bg-gradient-to-br ${rarityColor} text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg`}>
            {card.rarity.toUpperCase()}
          </div>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg mb-1 line-clamp-1">{card.nameEn}</CardTitle>
            <CardDescription className="line-clamp-1 text-xs">{card.nameSi}</CardDescription>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(card)}
              className="h-8 w-8"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(card.id)}
              className="h-8 w-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3 min-h-[2.5rem]">
          {card.descriptionEn}
        </p>

        {/* Category Badge */}
        {(card as any).category && (
          <div className="flex items-center gap-2 mb-2">
            <Tag className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground capitalize">
              {(card as any).category}
            </span>
          </div>
        )}

        {/* Unlock Condition */}
        {unlockText && (
          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded-md">
            <Sparkles className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-primary" />
            <span className="line-clamp-2">{unlockText}</span>
          </div>
        )}
      </CardContent>
    </UICard>
  );
}

function CardModal({
  card,
  onClose,
  onSave,
  isLoading,
}: {
  card?: Card;
  onClose: () => void;
  onSave: (data: Omit<Card, 'id'>) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    nameEn: card?.nameEn || '',
    nameSi: card?.nameSi || '',
    descriptionEn: card?.descriptionEn || '',
    descriptionSi: card?.descriptionSi || '',
    rarity: (card?.rarity || 'common') as 'common' | 'rare' | 'epic' | 'legendary',
    imageUrl: card?.imageUrl || '',
    unlockCondition: card?.unlockCondition 
      ? (typeof card.unlockCondition === 'string' 
          ? card.unlockCondition 
          : JSON.stringify(card.unlockCondition))
      : '',
    category: (card as any)?.category || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Parse unlock condition if it's a JSON string
    let unlockCondition: any = null;
    if (formData.unlockCondition.trim()) {
      try {
        unlockCondition = JSON.parse(formData.unlockCondition);
      } catch {
        // If not valid JSON, create a simple condition object
        unlockCondition = { type: 'custom', description: formData.unlockCondition };
      }
    }

    onSave({
      nameEn: formData.nameEn,
      nameSi: formData.nameSi,
      descriptionEn: formData.descriptionEn,
      descriptionSi: formData.descriptionSi,
      rarity: formData.rarity,
      imageUrl: formData.imageUrl || null,
      unlockCondition: unlockCondition,
      ...(formData.category && { category: formData.category }),
    } as any);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nameEn">Name (English) *</Label>
          <Input
            id="nameEn"
            value={formData.nameEn}
            onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
            required
            placeholder="First Steps"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nameSi">Name (Sinhala) *</Label>
          <Input
            id="nameSi"
            value={formData.nameSi}
            onChange={(e) => setFormData({ ...formData, nameSi: e.target.value })}
            required
            placeholder="පළමු පියවර"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="descriptionEn">Description (English) *</Label>
        <Textarea
          id="descriptionEn"
          value={formData.descriptionEn}
          onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
          rows={2}
          required
          placeholder="Complete your first lesson"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="descriptionSi">Description (Sinhala) *</Label>
        <Textarea
          id="descriptionSi"
          value={formData.descriptionSi}
          onChange={(e) => setFormData({ ...formData, descriptionSi: e.target.value })}
          rows={2}
          required
          placeholder="ඔබේ පළමු පාඩම සම්පූර්ණ කරන්න"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="rarity">Rarity *</Label>
          <Select
            id="rarity"
            value={formData.rarity}
            onChange={(e) => setFormData({ ...formData, rarity: e.target.value as Card['rarity'] })}
          >
            <option value="common">Common</option>
            <option value="rare">Rare</option>
            <option value="epic">Epic</option>
            <option value="legendary">Legendary</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            id="category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          >
            <option value="">None</option>
            <option value="streak">Streak</option>
            <option value="xp">XP</option>
            <option value="perfect">Perfect</option>
            <option value="completion">Completion</option>
            <option value="special">Special</option>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="imageUrl">Image URL</Label>
        <Input
          id="imageUrl"
          type="url"
          value={formData.imageUrl}
          onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
          placeholder="https://example.com/card-image.png"
        />
        <p className="text-xs text-muted-foreground">
          Leave empty to use placeholder image
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="unlockCondition">Unlock Condition (JSON)</Label>
        <Textarea
          id="unlockCondition"
          value={formData.unlockCondition}
          onChange={(e) => setFormData({ ...formData, unlockCondition: e.target.value })}
          rows={3}
          placeholder='{"type": "streak", "days": 7}'
        />
        <p className="text-xs text-muted-foreground">
          JSON format. Examples: {"{"}"type": "first_lesson"{"}"}, {"{"}"type": "streak", "days": 7{"}"}, {"{"}"type": "perfect_quiz"{"}"}
        </p>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </form>
  );
}
