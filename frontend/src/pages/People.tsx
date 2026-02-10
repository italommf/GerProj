import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { userService, type User } from '@/services/userService';
import { hierarchyService, nodePositionService, type Hierarchy, type NodePosition } from '@/services/teamService';
import { teamService, teamMemberService, type Team, type TeamMember } from '@/services/teamService';
import { Users, UserCheck, UserCog, Code, Crown, Plus, Trash2, ZoomIn, ZoomOut, Maximize2, Loader2, X, Palette } from 'lucide-react';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  MarkerType,
  BaseEdge,
  getSmoothStepPath,
  EdgeLabelRenderer,
  NodeResizer,
} from 'reactflow';
import type { ReactFlowInstance, EdgeProps } from 'reactflow';
import type { Node, Edge, Connection, NodeTypes, EdgeTypes } from 'reactflow';
import 'reactflow/dist/style.css';

type UserByRole = {
  supervisors: User[];
  gerentes: User[];
  desenvolvedores: User[];
  admins: User[];
  processos: User[];
};

type HierarchyTree = {
  supervisor: User;
  gerentes: {
    gerente: User;
    desenvolvedores: User[];
  }[];
};

// Funções auxiliares para roles (fora do componente)
const getRoleIcon = (role: string) => {
  switch (role) {
    case 'admin':
      return <Crown className="h-4 w-4" />;
    case 'supervisor':
      return <Users className="h-4 w-4" />;
    case 'gerente':
      return <UserCog className="h-4 w-4" />;
    case 'desenvolvedor':
      return <Code className="h-4 w-4" />;
    case 'dados':
      return <Code className="h-4 w-4" />;
    case 'processos':
      return <Code className="h-4 w-4" />;
    default:
      return <UserCheck className="h-4 w-4" />;
  }
};

const getRoleColor = (role: string) => {
  switch (role) {
    case 'admin':
      return 'bg-purple-100 text-purple-800 border-purple-300';
    case 'supervisor':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'gerente':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'desenvolvedor':
      return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'dados':
      return 'bg-purple-100 text-purple-800 border-purple-300';
    case 'processos':
      return 'bg-red-100 text-red-800 border-red-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const getRoleNodeStyle = (role: string) => {
  switch (role) {
    case 'admin':
      return 'bg-purple-50 border-purple-300';
    case 'supervisor':
      return 'bg-blue-50 border-blue-300';
    case 'gerente':
      return 'bg-green-50 border-green-300';
    case 'desenvolvedor':
      return 'bg-orange-50 border-orange-300';
    case 'dados':
      return 'bg-purple-50 border-purple-300';
    case 'processos':
      return 'bg-red-50 border-red-300';
    default:
      return 'bg-gray-50 border-gray-300';
  }
};

const getRoleLabel = (role: string) => {
  switch (role) {
    case 'desenvolvedor':
      return 'Dev.';
    case 'dados':
      return 'Dados';
    case 'processos':
      return 'Proc.';
    case 'supervisor':
      return 'Super.';
    case 'gerente':
      return 'G. Proj.';
    case 'admin':
      return 'Admin';
    default:
      return role;
  }
};

/** Nome para exibição na plataforma: first_name (e last_name se houver), senão username */
const getDisplayName = (user: User) => {
  const first = user.first_name?.trim();
  if (first) return user.last_name?.trim() ? `${first} ${user.last_name.trim()}` : first;
  return user.username ?? '';
};

// Cores predefinidas para sticky notes (transparentes)
const STICKY_NOTE_COLORS = [
  { name: 'Amarelo', value: 'yellow', bg: 'bg-yellow-100/60', border: 'border-yellow-300', text: 'text-yellow-900' },
  { name: 'Azul', value: 'blue', bg: 'bg-blue-100/60', border: 'border-blue-300', text: 'text-blue-900' },
  { name: 'Verde', value: 'green', bg: 'bg-green-100/60', border: 'border-green-300', text: 'text-green-900' },
  { name: 'Rosa', value: 'pink', bg: 'bg-pink-100/60', border: 'border-pink-300', text: 'text-pink-900' },
  { name: 'Roxo', value: 'purple', bg: 'bg-purple-100/60', border: 'border-purple-300', text: 'text-purple-900' },
  { name: 'Laranja', value: 'orange', bg: 'bg-orange-100/60', border: 'border-orange-300', text: 'text-orange-900' },
];

// Componente customizado de Node (fora do componente principal)
const UserNode = ({ data }: { data: { user: User; role: string } }) => {
  const { user, role } = data;
  const isSupervisor = role === 'supervisor';
  const isGerente = role === 'gerente';
  const isDev = role === 'desenvolvedor';
  const isDados = role === 'dados';
  const isProcessos = role === 'processos';
  
  return (
    <div className={`px-4 py-3 shadow-lg rounded-lg border-2 ${
      isSupervisor ? 'bg-blue-50 border-blue-300' :
      isGerente ? 'bg-green-50 border-green-300' :
      isDados ? 'bg-purple-50 border-purple-300' :
      isProcessos ? 'bg-red-50 border-red-300' :
      'bg-orange-50 border-orange-300'
    }`} style={{ minWidth: '200px' }}>
      <Handle 
        type="target" 
        position={Position.Top}
        style={{ 
          width: '16px', 
          height: '16px', 
          background: '#3b82f6',
          border: '3px solid white',
          borderRadius: '50%'
        }}
      />
      <div className="flex flex-col items-center">
        <Avatar className={`${isSupervisor ? 'h-[64px] w-[64px]' : isGerente ? 'h-[56px] w-[56px]' : 'h-[48px] w-[48px]'} mb-2`}>
          {user.profile_picture_url ? (
            <AvatarImage src={user.profile_picture_url} alt={getDisplayName(user)} />
          ) : null}
          <AvatarFallback>
            {getDisplayName(user).charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="text-center">
          <div className={`${(isDev || isDados || isProcessos) ? 'font-medium text-sm' : 'font-semibold'} text-[var(--color-foreground)]`}>
            {getDisplayName(user)}
          </div>
          {!(isDev || isDados || isProcessos) && (
            <div className="text-xs text-[var(--color-muted-foreground)] mt-1">
              {user.email}
            </div>
          )}
          <Badge className={`mt-2 ${getRoleColor(role)}`}>
            <div className="flex items-center gap-1">
              {getRoleIcon(role)}
              <span>{isDados ? 'Dados' : isProcessos ? 'Processos' : isDev ? 'Dev' : isSupervisor ? 'Supervisor' : 'Gerente'}</span>
            </div>
          </Badge>
        </div>
      </div>
      <Handle 
        type="source" 
        position={Position.Bottom}
        style={{ 
          width: '16px', 
          height: '16px', 
          background: '#3b82f6',
          border: '3px solid white',
          borderRadius: '50%'
        }}
      />
    </div>
  );
};

// Componente StickyNote para equipes
const StickyNoteNode = ({ data, selected }: { data: { team: Team; onDelete?: (teamId: string) => void; onColorChange?: (teamId: string, color: string) => void; canEdit?: boolean }; selected: boolean }) => {
  const { team, onDelete, onColorChange, canEdit = true } = data;
  const colorConfig = STICKY_NOTE_COLORS.find(c => c.value === team.cor) || STICKY_NOTE_COLORS[0];
  const [isEditing, setIsEditing] = useState(false);
  const [noteText, setNoteText] = useState(team.nome);
  
  const handleDelete = async () => {
    if (confirm('Tem certeza que deseja deletar esta equipe?')) {
      if (onDelete) {
        onDelete(team.id);
      }
    }
  };
  
  const handleColorChange = async (newColor: string) => {
    if (onColorChange) {
      onColorChange(team.id, newColor);
    }
  };
  
  const handleNameUpdate = async () => {
    setIsEditing(false);
    if (noteText !== team.nome && noteText.trim()) {
      try {
        await teamService.update(team.id, { nome: noteText.trim() });
      } catch (error) {
        console.error('Erro ao atualizar nome da equipe:', error);
        setNoteText(team.nome);
      }
    } else {
      setNoteText(team.nome);
    }
  };
  
  return (
    <div 
      className={`${colorConfig.bg} ${colorConfig.border} border-2 rounded-lg shadow-lg p-3 min-w-[150px] min-h-[100px] relative`}
      style={{ 
        width: '100%', 
        height: '100%',
      }}
    >
      <NodeResizer
        color={colorConfig.border === 'border-yellow-300' ? '#fcd34d' :
               colorConfig.border === 'border-blue-300' ? '#93c5fd' :
               colorConfig.border === 'border-green-300' ? '#86efac' :
               colorConfig.border === 'border-pink-300' ? '#f9a8d4' :
               colorConfig.border === 'border-purple-300' ? '#c4b5fd' :
               colorConfig.border === 'border-orange-300' ? '#fdba74' : '#9ca3af'}
        isVisible={selected}
        minWidth={150}
        minHeight={100}
      />
      
      {/* Header com ações */}
      <div 
        className={`flex items-center justify-between mb-2 pb-2 border-b ${colorConfig.border} border-opacity-30`}
        style={{ pointerEvents: 'auto' }} // Sempre permite interação no header
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Palette className={`h-4 w-4 ${colorConfig.text}`} />
          {isEditing ? (
            <input
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              onBlur={handleNameUpdate}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleNameUpdate();
                } else if (e.key === 'Escape') {
                  setNoteText(team.nome);
                  setIsEditing(false);
                }
              }}
              className={`flex-1 text-sm font-semibold ${colorConfig.text} bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-current rounded px-1`}
              autoFocus
            />
          ) : (
            <span 
              className={`font-semibold text-sm ${colorConfig.text} truncate ${canEdit ? 'cursor-pointer' : 'cursor-default'}`}
              onClick={canEdit ? () => setIsEditing(true) : undefined}
              title={canEdit ? "Clique para editar" : undefined}
            >
              {team.nome}
            </span>
          )}
        </div>
        {selected && (
          <div className="flex gap-1 items-center">
            <select
              value={team.cor}
              onChange={(e) => handleColorChange(e.target.value)}
              className={`text-xs border rounded px-1 py-0.5 ${colorConfig.bg} ${colorConfig.text}`}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {STICKY_NOTE_COLORS.map(color => (
                <option key={color.value} value={color.value}>
                  {color.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleDelete}
              className="text-red-600 hover:text-red-800"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
      
      {/* Conteúdo da nota */}
      <div 
        className={`text-sm ${colorConfig.text} overflow-auto`} 
        style={{ 
          height: 'calc(100% - 50px)',
          pointerEvents: 'auto', // Sempre permite interação no conteúdo
        }}
      >
        <p className="mb-1"><strong>Supervisor:</strong></p>
        <p className="text-xs opacity-80 mb-2">{team.supervisor_name || 'N/A'}</p>
        {canEdit && <p className="text-xs opacity-60 italic">Clique no nome para editar</p>}
      </div>
    </div>
  );
};

// Componente customizado de Edge com ícone de lixeira
const CustomEdge = ({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, markerEnd, data }: EdgeProps) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      <g>
        <BaseEdge 
          id={id} 
          path={edgePath} 
          markerEnd={markerEnd} 
          style={style}
        />
        {/* Path invisível mais largo para capturar eventos de hover */}
        <path
          d={edgePath}
          fill="none"
          stroke="transparent"
          strokeWidth={20}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{ cursor: 'pointer' }}
        />
      </g>
      <EdgeLabelRenderer>
        {isHovered && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
              zIndex: 1000,
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={(e) => {
              e.stopPropagation();
              // Disparar evento de deletar edge
              const deleteEvent = new CustomEvent('deleteEdge', { detail: { edgeId: id } });
              window.dispatchEvent(deleteEvent);
            }}
            className="cursor-pointer"
          >
            <div className="bg-white rounded-full p-1 shadow-lg border-2 border-red-500 hover:bg-red-50 transition-colors">
              <Trash2 className="h-4 w-4 text-red-500" />
            </div>
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
};

// nodeTypes definido fora do componente para evitar recriação
const nodeTypes: NodeTypes = {
  userNode: UserNode,
  stickyNote: StickyNoteNode,
};

// edgeTypes definido fora do componente
const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
};

export default function People() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [hierarchies, setHierarchies] = useState<Hierarchy[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  // Estados para formulário de equipe
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  
  // Delete/Alert dialogs
  const [deleteTeamDialogOpen, setDeleteTeamDialogOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<string | null>(null);
  const [deleteTeamLoading, setDeleteTeamLoading] = useState(false);
  
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [teamFormData, setTeamFormData] = useState({ nome: '', tipo: 'portal', supervisor: '', cor: 'yellow' });
  const [teamFormLoading, setTeamFormLoading] = useState(false);
  const [teamFormError, setTeamFormError] = useState<string | null>(null);
  
  // Estados para React Flow
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);
  
  // Estados para drag and drop do kanban
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Estados para posições dos nodes
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});
  // Rastrear nodes que foram recentemente arrastados para evitar reset
  const recentlyDraggedRef = useRef<Set<string>>(new Set());
  
  // Carregar posições salvas do backend
  const loadNodePositions = useCallback(async () => {
    try {
      const positions = await nodePositionService.getAll();
      const positionsMap: Record<string, { x: number; y: number }> = {};
      positions.forEach(pos => {
        positionsMap[pos.user] = { x: pos.x, y: pos.y };
      });
      console.log('Posições carregadas:', positionsMap);
      setNodePositions(positionsMap);
    } catch (error) {
      console.error('Erro ao carregar posições dos nodes:', error);
    }
  }, []);
  
  // Salvar posição de um node no backend
  const saveNodePosition = useCallback(async (userId: string, x: number, y: number) => {
    try {
      await nodePositionService.createOrUpdate({ user: userId, x, y });
    } catch (error) {
      console.error('Erro ao salvar posição do node:', error);
    }
  }, []);
  
  // Verificar se o usuário pode editar cargos
  const canEditRoles = currentUser?.role === 'admin' || currentUser?.role === 'supervisor';
  
  // Verificar se o usuário pode criar supervisores (apenas admin)
  const canCreateSupervisors = currentUser?.role === 'admin';

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [usersData, hierarchiesData, teamsData, teamMembersData] = await Promise.all([
        userService.getAll(),
        hierarchyService.getAll(),
        teamService.getAll(),
        teamMemberService.getAll(),
      ]);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setHierarchies(Array.isArray(hierarchiesData) ? hierarchiesData : []);
      setTeams(Array.isArray(teamsData) ? teamsData : []);
      setTeamMembers(Array.isArray(teamMembersData) ? teamMembersData : []);
      // Carregar posições dos nodes
      await loadNodePositions();
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }, [loadNodePositions]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtrar admin de todos os usuários
  const filteredUsers = users.filter(u => u.role !== 'admin');

  // Categorizar usuários por cargo
  const usersByRole: UserByRole = {
    supervisors: filteredUsers.filter(u => u.role === 'supervisor'),
    gerentes: filteredUsers.filter(u => u.role === 'gerente'),
    desenvolvedores: filteredUsers.filter(u => u.role === 'desenvolvedor'),
    admins: filteredUsers.filter(u => u.role === 'dados'), // Coluna "Administradores" agora mostra usuários "Dados"
    processos: filteredUsers.filter(u => u.role === 'processos'),
  };

  // Construir estrutura de equipes com hierarquias
  const buildTeamsStructure = () => {
    const teamsWithHierarchies = teams.map(team => {
      const teamHierarchies = hierarchies.filter(h => String(h.supervisor) === String(team.supervisor));
      return {
        team,
        hierarchies: teamHierarchies.map(h => {
          const gerente = users.find(u => String(u.id) === String(h.gerente));
          const desenvolvedor = h.desenvolvedor ? users.find(u => String(u.id) === String(h.desenvolvedor)) : null;
          return {
            hierarchy: h,
            gerente: gerente || null,
            desenvolvedor: desenvolvedor || null,
          };
        }),
      };
    });
    return teamsWithHierarchies;
  };

  const teamsStructure = buildTeamsStructure();

  // Construir estrutura hierárquica linear
  const buildHierarchyStructure = () => {
    const filteredUsers = users.filter(u => u.role !== 'admin');
    const supervisors = filteredUsers.filter(u => u.role === 'supervisor');
    const gerentes = filteredUsers.filter(u => u.role === 'gerente');
    const desenvolvedores = filteredUsers.filter(u => u.role === 'desenvolvedor' || u.role === 'dados' || u.role === 'processos');
    return {
      supervisors,
      gerentes,
      desenvolvedores,
    };
  };

  const hierarchyStructure = buildHierarchyStructure();

  // Handlers para sticky notes
  const handleTeamDelete = useCallback(async (teamId: string) => {
    try {
      await teamService.delete(teamId);
      await loadData();
    } catch (error) {
      console.error('Erro ao deletar equipe:', error);
    }
  }, [loadData]);

  const handleTeamColorChange = useCallback(async (teamId: string, color: string) => {
    try {
      await teamService.update(teamId, { cor: color });
      await loadData();
    } catch (error) {
      console.error('Erro ao atualizar cor da equipe:', error);
    }
  }, [loadData]);
  
  // Construir nodes do React Flow
  useEffect(() => {
    if (users.length === 0 && teams.length === 0) {
      setNodes([]);
      return;
    }
    
    // Filtrar usuários por role (excluir admins dos nodes do canvas)
    const filteredUsers = users.filter(u => u.role !== 'admin');
    const supervisors = filteredUsers.filter(u => u.role === 'supervisor');
    const gerentes = filteredUsers.filter(u => u.role === 'gerente');
    const desenvolvedores = filteredUsers.filter(u => u.role === 'desenvolvedor' || u.role === 'dados' || u.role === 'processos');
    
    // Criar nodes para todos os usuários (supervisores, gerentes, desenvolvedores e dados)
    // Admins não aparecem no canvas
    const allUsers = [...supervisors, ...gerentes, ...desenvolvedores];
    
    // Criar nodes para equipes (sticky notes)
    // Ordenar por data de criação (mais novas primeiro) para que fiquem por cima
    const sortedTeams = [...teams].sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA; // Mais recentes primeiro
    });
    
    const teamNodes: Node[] = sortedTeams.map((team, index) => ({
      id: `team-${team.id}`,
      type: 'stickyNote',
      position: { 
        x: team.posicao_x || 0, 
        y: team.posicao_y || 0 
      },
      data: { 
        team,
        onDelete: handleTeamDelete,
        onColorChange: handleTeamColorChange,
        canEdit: canEditRoles,
      },
      style: {
        width: team.largura || 200,
        height: team.altura || 150,
      },
      draggable: canEditRoles,
      selectable: canEditRoles,
      resizable: canEditRoles,
      zIndex: -10 + index, // zIndex negativo para ficar abaixo das edges (que têm zIndex padrão 0)
    }));
    
    setNodes((currentNodes) => {
      // Se os nodes já existem, atualizar posições e dados dos usuários
      if (currentNodes.length > 0) {
        const updatedNodes = currentNodes.map(node => {
          const userId = String(node.id);
          const currentUser = allUsers.find(u => String(u.id) === userId);
          const savedPosition = nodePositions[userId];
          
          // Se o usuário ainda existe, atualizar o node com os dados mais recentes
          if (currentUser) {
            // Se o node foi recentemente arrastado, preservar sua posição atual
            const wasRecentlyDragged = recentlyDraggedRef.current.has(userId);
            let positionToUse;
            
            if (wasRecentlyDragged) {
              // Se foi arrastado recentemente, manter a posição atual do node
              positionToUse = node.position;
            } else if (savedPosition) {
              // Se há posição salva e não foi arrastado recentemente, SEMPRE usar a posição salva
              positionToUse = savedPosition;
            } else {
              // Caso contrário, manter a posição atual do node (pode ser posição padrão ou já posicionada)
              positionToUse = node.position;
            }
            
            return {
              ...node,
              data: {
                user: currentUser,
                role: currentUser.role,
              },
              position: positionToUse,
              draggable: canEditRoles,
              zIndex: 10, // UserNodes sempre ficam acima das sticky notes
            };
          }
          
          // Se não existe mais, manter o node mas atualizar posição se houver
          if (savedPosition) {
            return {
              ...node,
              position: savedPosition,
            };
          }
          return node;
        });
        
        // Separar nodes de usuários e equipes
        const userNodes = updatedNodes.filter(node => !String(node.id).startsWith('team-'));
        const existingTeamNodes = updatedNodes.filter(node => String(node.id).startsWith('team-'));
        
        // Remover nodes de usuários que não existem mais
        const existingUserIds = new Set(allUsers.map(u => String(u.id)));
        const filteredUserNodes = userNodes.filter(node => existingUserIds.has(String(node.id)));
        
        // Atualizar nodes de equipes existentes
        // Ordenar equipes por data de criação para manter zIndex correto
        const sortedTeamsForUpdate = [...teams].sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA; // Mais recentes primeiro
        });
        
        const updatedTeamNodes = existingTeamNodes.map(node => {
          const teamId = String(node.id).replace('team-', '');
          const nodeId = String(node.id);
          const currentTeam = sortedTeamsForUpdate.find(t => String(t.id) === teamId);
          if (currentTeam) {
            const teamIndex = sortedTeamsForUpdate.findIndex(t => String(t.id) === teamId);
            // Se o node foi recentemente arrastado, preservar sua posição atual
            const wasRecentlyDragged = recentlyDraggedRef.current.has(nodeId);
            let positionToUse;
            
            if (wasRecentlyDragged) {
              // Se foi arrastado recentemente, manter a posição atual
              positionToUse = node.position;
            } else if (currentTeam.posicao_x !== undefined && currentTeam.posicao_y !== undefined) {
              // Se há posição salva no backend e não foi arrastado recentemente, SEMPRE usar a posição salva
              positionToUse = { x: currentTeam.posicao_x, y: currentTeam.posicao_y };
            } else {
              // Caso contrário, manter a posição atual do node
              positionToUse = node.position;
            }
            
            return {
              ...node,
              position: positionToUse,
              style: {
                width: currentTeam.largura || 200,
                height: currentTeam.altura || 150,
              },
              draggable: canEditRoles,
              selectable: canEditRoles,
              resizable: canEditRoles,
              zIndex: -10 + teamIndex, // zIndex negativo para ficar abaixo das edges
              data: {
                team: currentTeam,
                onDelete: handleTeamDelete,
                onColorChange: handleTeamColorChange,
              },
            };
          }
          return node;
        });
        
        // Adicionar novas equipes
        const existingTeamIds = new Set(existingTeamNodes.map(n => String(n.id).replace('team-', '')));
        const newTeamNodes = teamNodes.filter(tn => !existingTeamIds.has(String(tn.data.team.id)));
        
        // Verificar se algum usuário novo foi adicionado
        const currentUserIds = new Set(filteredUserNodes.map(n => n.id));
        const newUsers = allUsers.filter(u => !currentUserIds.has(String(u.id)));
        
        if (newUsers.length === 0 && newTeamNodes.length === 0) {
          return [...filteredUserNodes, ...updatedTeamNodes];
        }
        
        // Adicionar novos nodes de usuários
        const newUserNodes: Node[] = newUsers.map((user) => {
          const role = user.role;
          const userId = String(user.id);
          const savedPosition = nodePositions[userId];
          
          let x = 0;
          let y = 0;
          
          if (savedPosition) {
            x = savedPosition.x;
            y = savedPosition.y;
          } else {
            if (role === 'supervisor') {
              const supervisorIndex = supervisors.findIndex(u => u.id === user.id);
              x = 400;
              y = 100 + supervisorIndex * 200;
            } else if (role === 'gerente') {
              const gerenteIndex = gerentes.findIndex(u => u.id === user.id);
              x = 700;
              y = 100 + gerenteIndex * 200;
            } else {
              const devIndex = desenvolvedores.findIndex(u => u.id === user.id);
              x = 1000;
              y = 100 + devIndex * 200;
            }
          }
          
          return {
            id: userId,
            type: 'userNode',
            position: { x, y },
            data: { user, role },
            draggable: canEditRoles,
            zIndex: 10, // UserNodes sempre ficam acima das sticky notes
          };
        });
        
        return [...filteredUserNodes, ...updatedTeamNodes, ...newUserNodes, ...newTeamNodes];
      }
      
      // Construir nodes do zero
      const flowNodes: Node[] = [];
      
      console.log('Construindo nodes para', allUsers.length, 'usuários e', teams.length, 'equipes');
      
      allUsers.forEach((user) => {
        const role = user.role;
        const userId = String(user.id);
        const savedPosition = nodePositions[userId];
        
        // Posição inicial baseada no role e índice, ou usar posição salva
        let x = 0;
        let y = 0;
        
        if (savedPosition) {
          x = savedPosition.x;
          y = savedPosition.y;
        } else {
          // Distribuir nodes em colunas por role
          if (role === 'supervisor') {
            const supervisorIndex = supervisors.findIndex(u => u.id === user.id);
            x = 400;
            y = 100 + supervisorIndex * 200;
          } else if (role === 'gerente') {
            const gerenteIndex = gerentes.findIndex(u => u.id === user.id);
            x = 700;
            y = 100 + gerenteIndex * 200;
          } else {
            const devIndex = desenvolvedores.findIndex(u => u.id === user.id);
            x = 1000;
            y = 100 + devIndex * 200;
          }
        }
        
        flowNodes.push({
          id: userId,
          type: 'userNode',
          position: { x, y },
          data: { user, role },
          draggable: canEditRoles,
          zIndex: 10, // UserNodes sempre ficam acima das sticky notes
        });
      });
      
      // Adicionar nodes das equipes
      flowNodes.push(...teamNodes);
      
      return flowNodes;
    });
  }, [users, teams, nodePositions, handleTeamDelete, handleTeamColorChange, recentlyDraggedRef, canEditRoles]);

  // Construir edges do React Flow
  useEffect(() => {
    if (users.length === 0 || hierarchies.length === 0) {
      setEdges([]);
      return;
    }
    
    const flowEdges: Edge[] = [];
    const createdEdges = new Set<string>();
    
    // Obter IDs dos nodes atuais
    const nodeIds = new Set(nodes.map(n => String(n.id)));
    
    hierarchies.forEach((hierarchy) => {
      const supervisorExists = nodeIds.has(String(hierarchy.supervisor));
      const gerenteExists = hierarchy.gerente ? nodeIds.has(String(hierarchy.gerente)) : false;
      const devExists = hierarchy.desenvolvedor ? nodeIds.has(String(hierarchy.desenvolvedor)) : false;
      
      // Edge supervisor → gerente (se gerente existe)
      if (supervisorExists && gerenteExists) {
        const supervisorGerenteEdgeId = `edge-${hierarchy.supervisor}-${hierarchy.gerente}`;
        if (!createdEdges.has(supervisorGerenteEdgeId)) {
          flowEdges.push({
            id: supervisorGerenteEdgeId,
            source: String(hierarchy.supervisor),
            target: String(hierarchy.gerente),
            type: 'custom',
            animated: true,
            style: { 
              strokeWidth: 3, 
              stroke: '#3b82f6',
            },
            selected: false,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 20,
              height: 20,
              color: '#3b82f6',
            },
            data: { hierarchyId: hierarchy.id, type: 'supervisor-gerente' },
          });
          createdEdges.add(supervisorGerenteEdgeId);
        }
      }
      
      // Edge gerente → desenvolvedor (se gerente e desenvolvedor existem)
      if (hierarchy.desenvolvedor && gerenteExists && devExists) {
        const gerenteDevEdgeId = `edge-${hierarchy.gerente}-${hierarchy.desenvolvedor}`;
        if (!createdEdges.has(gerenteDevEdgeId)) {
          flowEdges.push({
            id: gerenteDevEdgeId,
            source: String(hierarchy.gerente),
            target: String(hierarchy.desenvolvedor),
            type: 'custom',
            animated: true,
            style: { 
              strokeWidth: 3, 
              stroke: '#3b82f6',
            },
            selected: false,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 20,
              height: 20,
              color: '#3b82f6',
            },
            data: { hierarchyId: hierarchy.id, type: 'gerente-desenvolvedor' },
          });
          createdEdges.add(gerenteDevEdgeId);
        }
      }
      
      // Edge supervisor → desenvolvedor (direto, sem gerente)
      if (hierarchy.desenvolvedor && !hierarchy.gerente && supervisorExists && devExists) {
        const supervisorDevEdgeId = `edge-${hierarchy.supervisor}-${hierarchy.desenvolvedor}`;
        if (!createdEdges.has(supervisorDevEdgeId)) {
          flowEdges.push({
            id: supervisorDevEdgeId,
            source: String(hierarchy.supervisor),
            target: String(hierarchy.desenvolvedor),
            type: 'custom',
            animated: true,
            style: { 
              strokeWidth: 3, 
              stroke: '#3b82f6',
            },
            selected: false,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 20,
              height: 20,
              color: '#3b82f6',
            },
            data: { hierarchyId: hierarchy.id, type: 'supervisor-desenvolvedor' },
          });
          createdEdges.add(supervisorDevEdgeId);
        }
      }
    });
    
    setEdges(flowEdges);
  }, [hierarchies, nodes]);
  
  // Ajustar visualização quando nodes forem atualizados
  useEffect(() => {
    if (nodes.length > 0 && reactFlowInstance.current) {
      setTimeout(() => {
        reactFlowInstance.current?.fitView({ padding: 0.2, duration: 400 });
      }, 100);
    }
  }, [nodes.length]);

  // Deletar edge quando uma conexão for removida
  const handleEdgeDelete = useCallback(async (edgeId: string) => {
    // Encontrar o edge que foi deletado
    const deletedEdge = edges.find(e => e.id === edgeId);
    if (!deletedEdge) return;
    
    // Buscar a hierarquia correspondente
    const hierarchyId = deletedEdge.data?.hierarchyId;
    
    if (hierarchyId) {
      try {
        await hierarchyService.delete(hierarchyId);
        // Atualizar estado local sem recarregar
        setHierarchies(prev => prev.filter(h => String(h.id) !== String(hierarchyId)));
      } catch (error: any) {
        console.error('Erro ao deletar hierarquia:', error);
        setAlertMessage(error.response?.data?.detail || 'Erro ao deletar conexão');
        setAlertDialogOpen(true);
      }
    } else {
      // Se não tiver hierarchyId no data, tentar encontrar pela estrutura do edge
      const sourceId = deletedEdge.source;
      const targetId = deletedEdge.target;
      
      // Encontrar hierarquias que correspondem a este edge
      const matchingHierarchies = hierarchies.filter(h => {
        if (deletedEdge.data?.type === 'supervisor-gerente') {
          return String(h.supervisor) === String(sourceId) && 
                 String(h.gerente) === String(targetId);
        } else if (deletedEdge.data?.type === 'gerente-desenvolvedor') {
          return String(h.gerente) === String(sourceId) && 
                 String(h.desenvolvedor) === String(targetId);
        } else if (deletedEdge.data?.type === 'supervisor-desenvolvedor') {
          return String(h.supervisor) === String(sourceId) && 
                 !h.gerente &&
                 String(h.desenvolvedor) === String(targetId);
        }
        return false;
      });
      
      // Deletar todas as hierarquias correspondentes
      const deletedIds: string[] = [];
      for (const hierarchy of matchingHierarchies) {
        try {
          await hierarchyService.delete(hierarchy.id);
          deletedIds.push(String(hierarchy.id));
        } catch (error: any) {
          console.error('Erro ao deletar hierarquia:', error);
          setAlertMessage(error.response?.data?.detail || 'Erro ao deletar conexão');
        setAlertDialogOpen(true);
        }
      }
      
      // Atualizar estado local sem recarregar
      if (deletedIds.length > 0) {
        setHierarchies(prev => prev.filter(h => !deletedIds.includes(String(h.id))));
      }
    }
  }, [edges, hierarchies]);

  // Listener para evento customizado de deletar edge
  useEffect(() => {
    const handleDeleteEdgeEvent = (event: CustomEvent) => {
      const { edgeId } = event.detail;
      handleEdgeDelete(edgeId);
    };

    window.addEventListener('deleteEdge', handleDeleteEdgeEvent as EventListener);
    return () => {
      window.removeEventListener('deleteEdge', handleDeleteEdgeEvent as EventListener);
    };
  }, [handleEdgeDelete]);
  
  // Salvar posições dos nodes quando movidos
  const onNodeDragStop = useCallback(async (event: any, node: Node) => {
    const nodeId = String(node.id);
    
    // Marcar como recentemente arrastado
    recentlyDraggedRef.current.add(nodeId);
    // Remover da lista após 2 segundos
    setTimeout(() => {
      recentlyDraggedRef.current.delete(nodeId);
    }, 2000);
    
    // Se for uma sticky note (equipe)
    if (nodeId.startsWith('team-')) {
      const teamId = nodeId.replace('team-', '');
      try {
        await teamService.update(teamId, {
          posicao_x: node.position.x,
          posicao_y: node.position.y,
        });
        // Atualizar o estado local imediatamente para evitar reset
        setNodes((currentNodes) => 
          currentNodes.map(n => 
            String(n.id) === nodeId 
              ? { ...n, position: node.position }
              : n
          )
        );
      } catch (error) {
        console.error('Erro ao salvar posição da equipe:', error);
      }
      return;
    }
    
    // Se for um node de usuário
    const newPosition = { x: node.position.x, y: node.position.y };
    // Atualizar estado local imediatamente
    setNodePositions(prev => ({
      ...prev,
      [nodeId]: newPosition,
    }));
    // Atualizar posição do node no estado do React Flow
    setNodes((currentNodes) => 
      currentNodes.map(n => 
        String(n.id) === nodeId 
          ? { ...n, position: newPosition }
          : n
      )
    );
    // Salvar no backend (sem await para não bloquear)
    saveNodePosition(nodeId, newPosition.x, newPosition.y);
  }, [setNodes, saveNodePosition]);
  
  // Handler para resize de nodes (sticky notes)
  const handleNodesChange = useCallback((changes: any[]) => {
    // Processar mudanças normalmente
    onNodesChange(changes);
    
    // Detectar mudanças de tamanho em sticky notes
    changes.forEach((change) => {
      if (change.type === 'dimensions' && change.id && String(change.id).startsWith('team-')) {
        const teamId = String(change.id).replace('team-', '');
        const node = nodes.find(n => String(n.id) === change.id);
        if (node && node.style) {
          teamService.update(teamId, {
            largura: typeof node.style.width === 'number' ? node.style.width : 200,
            altura: typeof node.style.height === 'number' ? node.style.height : 150,
          }).catch(error => {
            console.error('Erro ao salvar tamanho da equipe:', error);
          });
        }
      }
    });
  }, [onNodesChange, nodes]);
  
  // Interceptar mudanças nas edges para detectar deleções
  const handleEdgesChange = useCallback((changes: any[]) => {
    // Processar mudanças normalmente
    onEdgesChange(changes);
    
    // Detectar deleções
    changes.forEach((change) => {
      if (change.type === 'remove') {
        handleEdgeDelete(change.id);
      }
    });
  }, [onEdgesChange, handleEdgeDelete]);
  
  // Conectar nodes quando criar uma nova conexão
  const onConnect = useCallback(async (params: Connection) => {
    if (!params.source || !params.target) return;
    
    const sourceUser = users.find(u => String(u.id) === String(params.source));
    const targetUser = users.find(u => String(u.id) === String(params.target));
    
    if (!sourceUser || !targetUser) return;
    
    // Validar conexão: supervisor -> gerente -> desenvolvedor
    if (sourceUser.role === 'supervisor' && targetUser.role === 'gerente') {
      // Criar hierarquia supervisor -> gerente
      try {
        const existing = hierarchies.find(
          h => String(h.supervisor) === String(sourceUser.id) && 
               String(h.gerente) === String(targetUser.id)
        );
        
        if (!existing) {
          const newHierarchy = await hierarchyService.create({
            supervisor: sourceUser.id,
            gerente: targetUser.id,
            desenvolvedor: null,
          });
          // Atualizar estado local sem recarregar
          setHierarchies(prev => [...prev, newHierarchy]);
        }
      } catch (error: any) {
        setAlertMessage(error.response?.data?.detail || 'Erro ao criar conexão');
        setAlertDialogOpen(true);
      }
    } else if (sourceUser.role === 'gerente' && (targetUser.role === 'desenvolvedor' || targetUser.role === 'dados' || targetUser.role === 'processos')) {
      // Criar nova hierarquia gerente -> desenvolvedor
      // Um gerente pode ter múltiplos desenvolvedores, então criamos uma nova hierarquia
      try {
        // Verificar se já existe uma hierarquia com este supervisor-gerente-desenvolvedor
        const existing = hierarchies.find(
          h => String(h.gerente) === String(sourceUser.id) && 
               String(h.desenvolvedor) === String(targetUser.id)
        );
        
        if (existing) {
          // Já existe, não precisa criar novamente
          return;
        }
        
        // Encontrar uma hierarquia existente com este gerente para pegar o supervisor
        // Se não existir, usar o primeiro supervisor disponível
        const gerenteHierarchy = hierarchies.find(h => String(h.gerente) === String(sourceUser.id));
        let supervisorId = null;
        
        if (gerenteHierarchy) {
          supervisorId = gerenteHierarchy.supervisor;
        } else {
          // Se o gerente não tem supervisor ainda, usar o primeiro disponível
          const supervisor = users.find(u => u.role === 'supervisor');
          if (supervisor) {
            supervisorId = supervisor.id;
          } else {
            setAlertMessage('É necessário ter pelo menos um supervisor para criar esta hierarquia');
            setAlertDialogOpen(true);
            return;
          }
        }
        
        // Criar nova hierarquia (permite múltiplos desenvolvedores por gerente)
        const newHierarchy = await hierarchyService.create({
          supervisor: supervisorId,
          gerente: sourceUser.id,
          desenvolvedor: targetUser.id,
        });
        // Atualizar estado local sem recarregar
        setHierarchies(prev => [...prev, newHierarchy]);
      } catch (error: any) {
        setAlertMessage(error.response?.data?.detail || 'Erro ao criar conexão');
        setAlertDialogOpen(true);
      }
    } else if (sourceUser.role === 'supervisor' && (targetUser.role === 'desenvolvedor' || targetUser.role === 'dados' || targetUser.role === 'processos')) {
      // Criar hierarquia supervisor -> desenvolvedor (direto, sem gerente)
      try {
        const existing = hierarchies.find(
          h => String(h.supervisor) === String(sourceUser.id) && 
               !h.gerente &&
               String(h.desenvolvedor) === String(targetUser.id)
        );
        
        if (!existing) {
          const newHierarchy = await hierarchyService.create({
            supervisor: sourceUser.id,
            gerente: null,
            desenvolvedor: targetUser.id,
          });
          // Atualizar estado local sem recarregar
          setHierarchies(prev => [...prev, newHierarchy]);
        }
      } catch (error: any) {
        setAlertMessage(error.response?.data?.detail || 'Erro ao criar conexão');
        setAlertDialogOpen(true);
      }
    } else {
      setAlertMessage('Conexões permitidas: Supervisor → Gerente, Supervisor → Desenvolvedor/Dados/Processos, Gerente → Desenvolvedor/Dados/Processos');
      setAlertDialogOpen(true);
      return;
    }
  }, [users, hierarchies]);
  
  // Funções para gerenciar equipes
  const handleCreateTeam = async () => {
    if (!teamFormData.nome || !teamFormData.supervisor) {
      setTeamFormError('Nome e supervisor são obrigatórios');
      return;
    }
    
    try {
      setTeamFormLoading(true);
      setTeamFormError(null);
      await teamService.create({
        nome: teamFormData.nome,
        tipo: teamFormData.tipo,
        supervisor: teamFormData.supervisor,
        cor: teamFormData.cor,
        posicao_x: 100,
        posicao_y: 100,
        largura: 200,
        altura: 150,
      });
      setTeamDialogOpen(false);
      setTeamFormData({ nome: '', tipo: 'portal', supervisor: '', cor: 'yellow' });
      await loadData();
    } catch (error: any) {
      setTeamFormError(error.response?.data?.detail || 'Erro ao criar equipe');
    } finally {
      setTeamFormLoading(false);
    }
  };

  const handleDeleteTeam = (teamId: string) => {
    setTeamToDelete(teamId);
    setDeleteTeamDialogOpen(true);
  };
  
  const confirmDeleteTeam = async () => {
    if (!teamToDelete) return;
    
    setDeleteTeamLoading(true);
    try {
      await teamService.delete(teamToDelete);
      setDeleteTeamDialogOpen(false);
      setTeamToDelete(null);
      await loadData();
    } catch (error: any) {
      setAlertMessage(error.response?.data?.detail || 'Erro ao excluir equipe');
      setAlertDialogOpen(true);
    } finally {
      setDeleteTeamLoading(false);
    }
  };

  // Funções para drag and drop do kanban
  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || !canEditRoles) return;

    const draggedUser = users.find(u => String(u.id) === String(active.id));
    if (!draggedUser) return;

    // Identificar o cargo de destino
    let targetRole: string | null = null;
    if (over.id === 'supervisor' || over.id === 'gerente' || over.id === 'desenvolvedor' || over.id === 'dados' || over.id === 'processos') {
      targetRole = over.id;
    } else {
      // Se foi solto em outro usuário, verificar o cargo desse usuário
      const targetUser = users.find(u => String(u.id) === String(over.id));
      if (targetUser) {
        targetRole = targetUser.role;
      }
    }

    if (!targetRole || targetRole === draggedUser.role) return;

    // Validar permissões
    if (targetRole === 'supervisor' && !canCreateSupervisors) {
      setAlertMessage('Apenas administradores podem criar supervisores');
      setAlertDialogOpen(true);
      return;
    }

    // Atualizar o cargo do usuário
    try {
      setUpdating(true);
      
      // Atualizar estado local IMEDIATAMENTE para evitar animação de retorno
      const optimisticUser = { ...draggedUser, role: targetRole };
      setUsers(prev => prev.map(u => String(u.id) === String(draggedUser.id) ? optimisticUser : u));
      
      // Fazer a chamada à API
      const updatedUser = await userService.update(draggedUser.id, { role: targetRole });
      
      // Atualizar com os dados reais do servidor
      setUsers(prev => prev.map(u => String(u.id) === String(draggedUser.id) ? updatedUser : u));
      
      // Forçar atualização dos nodes no canvas com o novo role
      setNodes((currentNodes) => {
        return currentNodes.map(node => {
          if (String(node.id) === String(draggedUser.id)) {
            return {
              ...node,
              data: {
                user: updatedUser,
                role: targetRole,
              },
            };
          }
          return node;
        });
      });
    } catch (error: any) {
      // Reverter mudança em caso de erro
      setUsers(prev => prev.map(u => String(u.id) === String(draggedUser.id) ? draggedUser : u));
      setAlertMessage(error.response?.data?.detail || 'Erro ao atualizar cargo do usuário');
      setAlertDialogOpen(true);
    } finally {
      setUpdating(false);
    }
  };

  // Componente de card arrastável
  const DraggableUserCard = ({ user }: { user: User }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: user.id, disabled: !canEditRoles });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    const canDragThisUser = canEditRoles;

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`flex items-center gap-3 p-[12px] rounded-[8px] border-2 ${getRoleNodeStyle(user.role)} transition-colors ${
          !canDragThisUser ? 'opacity-50 cursor-not-allowed' : 'cursor-move'
        }`}
      >
        <Avatar className="h-[40px] w-[40px]">
          {user.profile_picture_url ? (
            <AvatarImage src={user.profile_picture_url} alt={getDisplayName(user)} />
          ) : null}
          <AvatarFallback>
            {getDisplayName(user).charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
        <Badge className={getRoleColor(user.role)}>
          <div className="flex items-center gap-1">
            {getRoleIcon(user.role)}
                <span>{getRoleLabel(user.role)}</span>
          </div>
        </Badge>
            <div className="font-medium text-sm text-black">
              {getDisplayName(user)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Componente de coluna droppable
  const DroppableRoleColumn = ({ role, title, users }: { role: string; title: string; users: User[] }) => {
    const { setNodeRef, isOver } = useDroppable({ id: role });

    return (
      <Card ref={setNodeRef} className={isOver ? 'ring-2 ring-[var(--color-primary)]' : ''}>
        <CardHeader>
          <CardTitle className="text-lg">
            {title} ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SortableContext items={users.map(u => u.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-[8px]">
              {users.map((user) => (
                <DraggableUserCard key={user.id} user={user} />
              ))}
              {users.length === 0 && (
                <div className="text-sm text-[var(--color-muted-foreground)] text-center py-4">
                  Nenhum usuário
                </div>
              )}
            </div>
          </SortableContext>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[var(--color-muted-foreground)]">Carregando pessoas...</div>
      </div>
    );
  }

  return (
    <div className="space-y-[24px]">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Pessoas</h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
          Visualize todos os usuários do sistema e a hierarquia organizacional
        </p>
      </div>

      {/* Canvas Interativo de Nodes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Hierarquia Organizacional - Canvas Interativo</CardTitle>
          <div className="flex gap-2">
            {canEditRoles && (
              <Button onClick={() => setTeamDialogOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Criar Equipe
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div style={{ width: '100%', height: '600px' }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
              onConnect={canEditRoles ? onConnect : undefined}
              onNodeDragStop={canEditRoles ? onNodeDragStop : undefined}
              nodesDraggable={canEditRoles}
              nodesConnectable={canEditRoles}
              elementsSelectable={canEditRoles}
              onInit={(instance) => {
                reactFlowInstance.current = instance;
                if (nodes.length > 0) {
                  setTimeout(() => {
                    instance.fitView({ padding: 0.2, duration: 400 });
                  }, 100);
                }
              }}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              deleteKeyCode={canEditRoles ? ['Delete', 'Backspace'] : null}
              fitView
              attributionPosition="bottom-left"
            >
              <Background />
              <Controls />
              <MiniMap />
            </ReactFlow>
          </div>
          {nodes.length === 0 && (
            <div className="text-center py-8 text-[var(--color-muted-foreground)]">
              Nenhum usuário encontrado para exibir no canvas
            </div>
          )}
          <div className="mt-4 text-sm text-[var(--color-muted-foreground)]">
            <p>💡 Dica: Arraste os nodes para reposicioná-los. Conecte nodes arrastando de um handle (ponto) para outro.</p>
            <p>Para deletar uma conexão, selecione a linha e pressione Delete ou Backspace.</p>
            <p>Use os controles no canto inferior esquerdo para zoom in/out e navegação.</p>
          </div>
        </CardContent>
      </Card>

      {/* Kanban para definir cargos */}
      <Card>
        <CardHeader>
          <CardTitle>Lista por Cargo</CardTitle>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
            {canEditRoles 
              ? 'Arraste os cards entre as colunas para alterar o cargo dos usuários'
              : 'Apenas supervisores podem arrastar os cards para alterar cargos'}
          </p>
        </CardHeader>
        <CardContent>
          <DndContext
            sensors={canEditRoles ? sensors : []}
            collisionDetection={closestCorners}
            onDragStart={canEditRoles ? handleDragStart : undefined}
            onDragEnd={canEditRoles ? handleDragEnd : undefined}
          >
              <div className="grid gap-[16px] md:grid-cols-2 lg:grid-cols-5">
                <DroppableRoleColumn
                  role="supervisor"
                  title="Supervisores"
                  users={usersByRole.supervisors}
                />
                <DroppableRoleColumn
                  role="gerente"
                  title="Gerentes de Projeto"
                  users={usersByRole.gerentes}
                />
                <DroppableRoleColumn
                  role="desenvolvedor"
                  title="Desenvolvedores"
                  users={usersByRole.desenvolvedores}
                />
                <DroppableRoleColumn
                  role="dados"
                  title="Dados"
                  users={usersByRole.admins}
                />
                <DroppableRoleColumn
                  role="processos"
                  title="Processos"
                  users={usersByRole.processos}
                />
              </div>
              {canEditRoles && (
                <DragOverlay>
                  {activeId ? (
                    <div className="flex items-center gap-3 p-[12px] rounded-[8px] border border-[var(--color-border)] bg-[var(--color-card)] shadow-lg">
                      <Avatar className="h-[40px] w-[40px]">
                        <AvatarFallback>
                          {(() => {
                            const u = users.find(u => String(u.id) === String(activeId));
                            return u ? getDisplayName(u).charAt(0) || 'U' : 'U';
                          })()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="font-medium text-sm">
                        {(() => {
                          const u = users.find(u => String(u.id) === String(activeId));
                          return u ? getDisplayName(u) : '';
                        })()}
                      </div>
                    </div>
                  ) : null}
                </DragOverlay>
              )}
            </DndContext>
          </CardContent>
        </Card>
      
      {/* Modal de Criação de Equipe */}
      <Dialog open={teamDialogOpen} onOpenChange={setTeamDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova Equipe</DialogTitle>
            <DialogDescription>
              Crie uma nova equipe e defina o supervisor responsável.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCreateTeam();
            }}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="team-nome">Nome da Equipe</Label>
              <Input
                id="team-nome"
                value={teamFormData.nome}
                onChange={(e) => setTeamFormData({ ...teamFormData, nome: e.target.value })}
                placeholder="Ex: Equipe Frontend"
                required
              />
            </div>
            <div>
              <Label htmlFor="team-tipo">Tipo</Label>
              <select
                id="team-tipo"
                value={teamFormData.tipo}
                onChange={(e) => setTeamFormData({ ...teamFormData, tipo: e.target.value })}
                className="flex h-[40px] w-full rounded-[8px] border border-[var(--color-input)] bg-[var(--color-background)] px-[12px] py-[8px] text-sm ring-offset-[var(--color-background)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2"
              >
                <option value="portal">Portal</option>
                <option value="rpa">RPA</option>
                <option value="ia">IA</option>
                <option value="dados">Dados</option>
                <option value="processos">Processos</option>
                <option value="front">Frontend</option>
                <option value="back">Backend</option>
              </select>
            </div>
            <div>
              <Label htmlFor="team-supervisor">Supervisor</Label>
              <select
                id="team-supervisor"
                value={teamFormData.supervisor}
                onChange={(e) => setTeamFormData({ ...teamFormData, supervisor: e.target.value })}
                required
                className="flex h-[40px] w-full rounded-[8px] border border-[var(--color-input)] bg-[var(--color-background)] px-[12px] py-[8px] text-sm ring-offset-[var(--color-background)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2"
              >
                <option value="">Selecione um supervisor</option>
                {usersByRole.supervisors.map((supervisor) => (
                  <option key={supervisor.id} value={supervisor.id}>
                    {getDisplayName(supervisor)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="team-cor">Cor da Nota</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {STICKY_NOTE_COLORS.map(color => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setTeamFormData({ ...teamFormData, cor: color.value })}
                    className={`p-3 rounded border-2 transition-all ${
                      teamFormData.cor === color.value 
                        ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)] ring-offset-2' 
                        : 'border-transparent hover:border-[var(--color-border)]'
                    } ${color.bg.replace('/60', '')} ${color.border} hover:opacity-80`}
                  >
                    <div className={`w-full h-8 rounded ${color.bg.replace('/60', '')} ${color.border} border mb-1 opacity-60`}></div>
                    <span className={`text-xs ${color.text} font-medium`}>{color.name}</span>
                  </button>
                ))}
              </div>
            </div>
            {teamFormError && (
              <div className="text-sm text-red-600">{teamFormError}</div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setTeamDialogOpen(false);
                  setTeamFormData({ nome: '', tipo: 'portal', supervisor: '', cor: 'yellow' });
                  setTeamFormError(null);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={teamFormLoading}>
                {teamFormLoading ? 'Criando...' : 'Criar Equipe'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Team Confirmation Dialog */}
      <Dialog open={deleteTeamDialogOpen} onOpenChange={setDeleteTeamDialogOpen}>
        <DialogContent onClose={() => {
          setDeleteTeamDialogOpen(false);
          setTeamToDelete(null);
        }}>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta equipe? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDeleteTeamDialogOpen(false);
                setTeamToDelete(null);
              }}
              disabled={deleteTeamLoading}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDeleteTeam}
              disabled={deleteTeamLoading}
            >
              {deleteTeamLoading ? (
                <>
                  <Loader2 className="mr-[8px] h-[16px] w-[16px] animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Excluir'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog */}
      <Dialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
        <DialogContent onClose={() => {
          setAlertDialogOpen(false);
          setAlertMessage('');
        }}>
          <DialogHeader>
            <DialogTitle>Atenção</DialogTitle>
            <DialogDescription>
              {alertMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="default"
              onClick={() => {
                setAlertDialogOpen(false);
                setAlertMessage('');
              }}
            >
              Entendi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
