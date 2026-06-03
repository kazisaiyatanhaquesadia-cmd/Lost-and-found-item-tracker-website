import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, MapPin, Calendar, DollarSign, Heart, AlertTriangle } from 'lucide-react';

interface Item {
  id: string;
  title: string;
  description: string;
  type: 'lost' | 'found';
  location?: string;
  date_lost_found?: string;
  reward_offered?: number;
  image_urls?: string[];
  tags?: string[];
  created_at: string;
  status: string;
  category_id?: string;
  categories?: { name: string };
  profiles?: { full_name: string };
}

export const SearchItems: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [loading, setLoading] = useState(false);

  // Get URL parameters for initial filtering
  const urlParams = new URLSearchParams(window.location.search);
  const initialType = urlParams.get('type');

  useEffect(() => {
    // Set initial type filter from URL
    if (initialType && (initialType === 'lost' || initialType === 'found')) {
      setSelectedType(initialType);
    }
    fetchItems();
    fetchCategories();
  }, []);

  useEffect(() => {
    filterItems();
  }, [items, searchTerm, selectedCategory, selectedType]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('items')
        .select(`
          *,
          categories(name),
          profiles(full_name)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems((data as unknown as Item[]) || []);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (!error && data) {
      setCategories(data);
    }
  };

  const filterItems = () => {
    let filtered = items;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term) ||
        item.location?.toLowerCase().includes(term) ||
        item.tags?.some(tag => tag.toLowerCase().includes(term)) ||
        item.categories?.name.toLowerCase().includes(term)
      );
    }

    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category_id === selectedCategory);
    }

    if (selectedType && selectedType !== 'all') {
      filtered = filtered.filter(item => item.type === selectedType);
    }

    setFilteredItems(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedType('all');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Card className="shadow-gentle">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading items...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Section */}
      <Card className="shadow-gentle">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Search Lost & Found Items
          </CardTitle>
          <CardDescription>
            Find lost items or browse found items in our community
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by title, description, location, category, or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2">
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                    <SelectItem value="found">Found</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button variant="outline" onClick={clearFilters}>
                  <Filter className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {filteredItems.length} item(s) found
          </h3>
        </div>

        {filteredItems.length === 0 ? (
          <Card className="shadow-gentle">
            <CardContent className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">No items found matching your criteria</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <Card key={item.id} className="shadow-gentle hover:shadow-warm transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {item.type === 'lost' ? (
                        <AlertTriangle className="h-4 w-4 text-warning" />
                      ) : (
                        <Heart className="h-4 w-4 text-secondary" />
                      )}
                      <Badge variant={item.type === 'lost' ? 'destructive' : 'secondary'}>
                        {item.type}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(item.created_at)}
                    </span>
                  </div>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {item.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {item.image_urls && item.image_urls.length > 0 && (
                    <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                      <img
                        src={item.image_urls[0]}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    {item.location && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {item.location}
                      </div>
                    )}
                    
                    {item.date_lost_found && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {formatDate(item.date_lost_found)}
                      </div>
                    )}
                    
                    {item.reward_offered && item.reward_offered > 0 && (
                      <div className="flex items-center gap-2 text-sm text-success">
                        <DollarSign className="h-4 w-4" />
                        Reward: ${item.reward_offered}
                      </div>
                    )}
                    
                    {item.categories?.name && (
                      <Badge variant="outline" className="text-xs">
                        {item.categories.name}
                      </Badge>
                    )}
                    
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {item.tags.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{item.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-2">
                    <Button className="w-full" variant="outline" onClick={() => navigate(`/item/${item.id}`)}>
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};