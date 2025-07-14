import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Volume2, RotateCcw, Home } from 'lucide-react';

// Import animal images
import crabImg from '@/assets/crab.png';
import fishImg from '@/assets/fish.png';
import shrimpImg from '@/assets/shrimp.png';
import deerImg from '@/assets/deer.png';
import roosterImg from '@/assets/rooster.png';
import gourdImg from '@/assets/gourd.png';

interface Animal {
  id: string;
  name: string;
  image: string;
  vietnamese: string;
}

interface DiceResult {
  face: string;
  animating: boolean;
}

interface Bet {
  animal: string;
  amount: number;
}

const animals: Animal[] = [
  { id: 'crab', name: 'Crab', image: crabImg, vietnamese: 'Cua' },
  { id: 'fish', name: 'Fish', image: fishImg, vietnamese: 'Cá' },
  { id: 'shrimp', name: 'Shrimp', image: shrimpImg, vietnamese: 'Tôm' },
  { id: 'deer', name: 'Deer', image: deerImg, vietnamese: 'Nai' },
  { id: 'rooster', name: 'Rooster', image: roosterImg, vietnamese: 'Gà' },
  { id: 'gourd', name: 'Gourd', image: gourdImg, vietnamese: 'Bầu' }
];

const BauCuaGame: React.FC = () => {
  const [coins, setCoins] = useState(10000);
  const [bets, setBets] = useState<Record<string, number>>({});
  const [diceResults, setDiceResults] = useState<DiceResult[]>([
    { face: 'crab', animating: false },
    { face: 'fish', animating: false },
    { face: 'shrimp', animating: false }
  ]);
  const [isRolling, setIsRolling] = useState(false);
  const [gamePhase, setGamePhase] = useState<'betting' | 'rolling' | 'result'>('betting');
  const [winningAnimals, setWinningAnimals] = useState<string[]>([]);
  
  // Secret control state
  const [tapSequence, setTapSequence] = useState<number[]>([]);
  const [secretMode, setSecretMode] = useState(false);
  const [lastTapTime, setLastTapTime] = useState(0);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  
  const { toast } = useToast();

  // Secret tap pattern: tap 3 times quickly in top-left, then 2 times in center
  const SECRET_PATTERN = [1, 1, 1, 2, 2]; // 1 = top-left, 2 = center
  const TAP_TIMEOUT = 1000; // Reset sequence after 1 second of inactivity

  useEffect(() => {
    const timer = setTimeout(() => {
      if (tapSequence.length > 0) {
        setTapSequence([]);
      }
    }, TAP_TIMEOUT);

    return () => clearTimeout(timer);
  }, [lastTapTime, tapSequence.length]);

  const handleSecretTap = (e: React.MouseEvent) => {
    if (!gameAreaRef.current) return;
    
    const rect = gameAreaRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const width = rect.width;
    const height = rect.height;
    
    let zone = 0;
    
    // Determine tap zone
    if (x < width * 0.3 && y < height * 0.3) {
      zone = 1; // top-left
    } else if (x > width * 0.3 && x < width * 0.7 && y > height * 0.3 && y < height * 0.7) {
      zone = 2; // center
    }
    
    if (zone > 0) {
      const now = Date.now();
      setLastTapTime(now);
      
      const newSequence = [...tapSequence, zone];
      setTapSequence(newSequence);
      
      // Check if pattern matches
      if (newSequence.length === SECRET_PATTERN.length) {
        const matches = newSequence.every((val, index) => val === SECRET_PATTERN[index]);
        if (matches) {
          setSecretMode(true);
          setTapSequence([]);
          toast({
            title: "🎰 Chế độ may mắn kích hoạt!",
            description: "Xác suất thắng đã được tăng lên!",
          });
        } else {
          setTapSequence([]);
        }
      } else if (newSequence.length > SECRET_PATTERN.length) {
        setTapSequence([]);
      }
    }
  };

  const placeBet = (animalId: string, amount: number) => {
    if (gamePhase !== 'betting') return;
    if (coins < amount) {
      toast({
        title: "Không đủ xu!",
        description: "Bạn không có đủ xu để đặt cược.",
        variant: "destructive"
      });
      return;
    }

    setBets(prev => ({
      ...prev,
      [animalId]: (prev[animalId] || 0) + amount
    }));
    setCoins(prev => prev - amount);
  };

  const rollDice = () => {
    if (gamePhase !== 'betting') return;
    
    const totalBet = Object.values(bets).reduce((sum, bet) => sum + bet, 0);
    if (totalBet === 0) {
      toast({
        title: "Chưa đặt cược!",
        description: "Hãy đặt cược trước khi lắc xúc xắc.",
        variant: "destructive"
      });
      return;
    }

    setIsRolling(true);
    setGamePhase('rolling');
    
    // Animation phase
    setDiceResults(prev => prev.map(dice => ({ ...dice, animating: true })));
    
    setTimeout(() => {
      // Generate results with secret mode influence
      const results: DiceResult[] = [];
      const animalIds = animals.map(a => a.id);
      
      for (let i = 0; i < 3; i++) {
        let randomAnimal;
        
        if (secretMode && Math.random() < 0.7) {
          // In secret mode, 70% chance to favor player's bets
          const playerBets = Object.keys(bets).filter(key => bets[key] > 0);
          if (playerBets.length > 0) {
            randomAnimal = playerBets[Math.floor(Math.random() * playerBets.length)];
          } else {
            randomAnimal = animalIds[Math.floor(Math.random() * animalIds.length)];
          }
        } else {
          randomAnimal = animalIds[Math.floor(Math.random() * animalIds.length)];
        }
        
        results.push({ face: randomAnimal, animating: false });
      }
      
      setDiceResults(results);
      setIsRolling(false);
      setGamePhase('result');
      
      // Calculate winnings
      const winCounts: Record<string, number> = {};
      results.forEach(result => {
        winCounts[result.face] = (winCounts[result.face] || 0) + 1;
      });
      
      const winners = Object.keys(winCounts);
      setWinningAnimals(winners);
      
      let totalWinnings = 0;
      Object.entries(bets).forEach(([animal, betAmount]) => {
        const count = winCounts[animal] || 0;
        if (count > 0) {
          const payout = betAmount * (count + 1); // 1:1 base + bonus for multiple dice
          totalWinnings += payout;
        }
      });
      
      if (totalWinnings > 0) {
        setCoins(prev => prev + totalWinnings);
        toast({
          title: "🎉 Chúc mừng!",
          description: `Bạn thắng ${totalWinnings} xu!`,
        });
      } else {
        toast({
          title: "😔 Không may",
          description: "Hãy thử lại lần sau!",
        });
      }
      
      // Reset for next round
      setTimeout(() => {
        setGamePhase('betting');
        setBets({});
        setWinningAnimals([]);
        if (secretMode) {
          // Secret mode only lasts one round
          setSecretMode(false);
        }
      }, 3000);
    }, 2000);
  };

  const resetGame = () => {
    setCoins(10000);
    setBets({});
    setGamePhase('betting');
    setWinningAnimals([]);
    setSecretMode(false);
    setTapSequence([]);
  };

  return (
    <div 
      ref={gameAreaRef}
      onClick={handleSecretTap}
      className="min-h-screen bg-gradient-to-br from-game-blue via-blue-800 to-blue-900 relative overflow-hidden"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={resetGame}>
            <Home className="h-4 w-4 text-white" />
          </Button>
          <Button variant="ghost" size="sm">
            <Volume2 className="h-4 w-4 text-white" />
          </Button>
        </div>
        
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white drop-shadow-lg">
            Bầu Cua VNG 2024-2025
          </h1>
          {secretMode && (
            <div className="text-xs text-yellow-300 animate-pulse">
              ⭐ Chế độ may mắn đang hoạt động
            </div>
          )}
        </div>
        
        <div className="text-right">
          <div className="text-yellow-300 text-lg font-bold">
            {coins.toLocaleString()} xu
          </div>
        </div>
      </div>

      {/* Top betting area */}
      <div className="grid grid-cols-3 gap-4 p-4">
        {animals.slice(0, 3).map((animal) => (
          <Card 
            key={animal.id}
            className={`p-4 bg-white/90 backdrop-blur-sm border-2 relative overflow-hidden
                       transition-all duration-300 hover:scale-105 cursor-pointer
                       ${winningAnimals.includes(animal.id) ? 'border-yellow-400 animate-glow-pulse' : 'border-gray-300'}
                       ${bets[animal.id] ? 'ring-2 ring-blue-400' : ''}`}
            onClick={() => placeBet(animal.id, 100)}
          >
            <div className="text-center">
              <img 
                src={animal.image} 
                alt={animal.name}
                className="w-16 h-16 mx-auto mb-2 transition-transform duration-300 hover:scale-110"
              />
              <div className="text-sm font-semibold text-gray-800">
                {animal.vietnamese}
              </div>
              {bets[animal.id] && (
                <div className="text-xs text-blue-600 font-bold mt-1">
                  {bets[animal.id]} xu
                </div>
              )}
            </div>
            
            {/* Dice dots indicator */}
            <div className="absolute top-2 right-2 grid grid-cols-3 gap-1">
              {[1, 2, 3, 4, 5, 6].map((dot) => (
                <div 
                  key={dot}
                  className="w-2 h-2 bg-blue-500 rounded-full"
                />
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* Central dice area */}
      <div className="flex justify-center py-8">
        <div className="relative">
          {/* Dice container */}
          <div className="bg-white/80 backdrop-blur-md rounded-full p-8 shadow-xl border-4 border-white/50">
            <div className="flex gap-6 justify-center items-center">
              {diceResults.map((dice, index) => (
                <div 
                  key={index}
                  className={`w-20 h-20 bg-white rounded-lg shadow-lg border-2 border-gray-300
                             flex items-center justify-center transition-all duration-500
                             ${dice.animating ? 'animate-dice-roll' : ''}
                             ${isRolling ? 'animate-bounce' : ''}`}
                >
                  <img 
                    src={animals.find(a => a.id === dice.face)?.image} 
                    alt="dice"
                    className="w-12 h-12"
                  />
                </div>
              ))}
            </div>
          </div>
          
          {/* Roll button */}
          <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
            {gamePhase === 'betting' ? (
              <Button 
                onClick={rollDice}
                size="lg"
                className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700
                          text-black font-bold px-8 py-4 rounded-full shadow-lg
                          transform transition-all duration-200 hover:scale-105 active:scale-95"
              >
                LẮC XÚC XẮC
              </Button>
            ) : gamePhase === 'rolling' ? (
              <Button 
                disabled
                size="lg"
                className="bg-gray-500 text-white font-bold px-8 py-4 rounded-full"
              >
                ĐANG LẮC...
              </Button>
            ) : (
              <Button 
                disabled
                size="lg"
                className="bg-green-500 text-white font-bold px-8 py-4 rounded-full"
              >
                KẾT QUẢ
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom betting area */}
      <div className="grid grid-cols-3 gap-4 p-4 mt-16">
        {animals.slice(3, 6).map((animal) => (
          <Card 
            key={animal.id}
            className={`p-4 bg-white/90 backdrop-blur-sm border-2 relative overflow-hidden
                       transition-all duration-300 hover:scale-105 cursor-pointer
                       ${winningAnimals.includes(animal.id) ? 'border-yellow-400 animate-glow-pulse' : 'border-gray-300'}
                       ${bets[animal.id] ? 'ring-2 ring-blue-400' : ''}`}
            onClick={() => placeBet(animal.id, 100)}
          >
            <div className="text-center">
              <img 
                src={animal.image} 
                alt={animal.name}
                className="w-16 h-16 mx-auto mb-2 transition-transform duration-300 hover:scale-110"
              />
              <div className="text-sm font-semibold text-gray-800">
                {animal.vietnamese}
              </div>
              {bets[animal.id] && (
                <div className="text-xs text-blue-600 font-bold mt-1">
                  {bets[animal.id]} xu
                </div>
              )}
            </div>
            
            {/* Dice dots indicator */}
            <div className="absolute top-2 right-2 grid grid-cols-3 gap-1">
              {[1, 2, 3, 4, 5, 6].map((dot) => (
                <div 
                  key={dot}
                  className="w-2 h-2 bg-blue-500 rounded-full"
                />
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* Bottom branding */}
      <div className="text-center py-4 bg-black/20 backdrop-blur-sm mt-8">
        <div className="text-yellow-300 text-xl font-bold">XÓC ĐĨA</div>
        <div className="text-white text-sm">V.N.G : 12092-5021</div>
      </div>

      {/* Floating sparkles effect */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-float opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default BauCuaGame;