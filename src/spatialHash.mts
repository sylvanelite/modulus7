import { Utils } from "./lib/definitions.mjs";


interface ISpatialHash{
    cells:Array<Set<number>>;//each cell holds a set of entity ids
}
function hashXY(x:number,y:number){
    //given an x and a y location, hash them with an avalanche function so that the cell can be computed
    //add fixed value to y and modulo x so that x and y don't usually have the same values
    //XOR on the same values results in 0, so try avoid this
    return Utils.hash(Utils.hash(x%10000)^Utils.hash(y+10000));
}
class SpatialHash{
    //spatial hash reserves a given number of cell
    //takes in X/Y of objects and stores those objects (ids) in cells
    //this is for broad phase collision,
    //hash collisions are possible on entities with dissimilar coordinates
    static spatialHash(totalCells:number):ISpatialHash{
        const cells = [];
        for(let i=0;i<totalCells;i+=1){
            cells.push(new Set<number>());
        }
        return {cells}
    }
    static clear(self:ISpatialHash){
        for(let i=0;i<self.cells.length;i+=1){
            self.cells[i].clear();
        }
    }
    static add(self:ISpatialHash,entity:number,x:number,y:number,width:number,height:number){
        const startX = Math.floor(x);
        const startY = Math.floor(y);
        const endX = Math.floor((x+width));
        const endY = Math.floor((y+height));
        const middleX = Math.floor(x+width/2);
        const middleY = Math.floor(y+height/2);
        //only store extremities/middle
        const L = hashXY(startX,startY) % self.cells.length;
        const R = hashXY(endX,startY) % self.cells.length;
        const U = hashXY(startX,endX) % self.cells.length;
        const D = hashXY(endX,endY) % self.cells.length;
        const C = hashXY(middleX,middleY) % self.cells.length;
        self.cells[L].add(entity);
        self.cells[R].add(entity);
        self.cells[U].add(entity);
        self.cells[D].add(entity);
        self.cells[C].add(entity);
    }
    static query(self:ISpatialHash,x:number,y:number,width:number,height:number):Array<number>{
        const startX = Math.floor(x);
        const startY = Math.floor(y);
        const endX = Math.floor((x+width));
        const endY = Math.floor((y+height));
        const middleX = Math.floor(x+width/2);
        const middleY = Math.floor(y+height/2);
        //only check extremities/middle
        const L = hashXY(startX,startY) % self.cells.length;
        const R = hashXY(endX,startY) % self.cells.length;
        const U = hashXY(startX,endX) % self.cells.length;
        const D = hashXY(endX,endY) % self.cells.length;
        const C = hashXY(middleX,middleY) % self.cells.length;
        const res = new Set<number>();
        for(const e of self.cells[L]){res.add(e);}
        for(const e of self.cells[R]){res.add(e);}
        for(const e of self.cells[U]){res.add(e);}
        for(const e of self.cells[D]){res.add(e);}
        for(const e of self.cells[C]){res.add(e);}
        return [...res];
    }
    static collision(
        x1:number,y1:number,z1:number,width1:number,height1:number,depth1:number,
        x2:number,y2:number,z2:number,width2:number,height2:number,depth2:number, ){
        //narrow phase collision... probably doesn't need to include Z (depth)
        return (x1 <= x2+width2 &&
          x2 <= x1+width1 &&
          y1 <= y2+height2 &&
          y2 <= y1+height1 &&
          z1 <= z2+depth2 &&
          z2 <= z1+depth1);
    }
}

export {SpatialHash,type ISpatialHash}


