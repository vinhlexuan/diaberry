import { 
    Column, 
    CreateDateColumn,
    UpdateDateColumn,
    Entity,
    PrimaryColumn,
    ManyToOne,
    JoinColumn,
  } from "typeorm";
import { User } from "./user";
import { Diary } from "./diary";

@Entity("diary_share")
export class DiaryShare {
    @PrimaryColumn()
    diary_id!: number;

    @PrimaryColumn()
    user_id!: number;

    @ManyToOne(() => User, { onDelete: "CASCADE" })
    @JoinColumn({ name: "user_id" })
    user!: User;

    @ManyToOne(() => Diary, { onDelete: "CASCADE" })
    @JoinColumn({ name: "diary_id" })
    diary!: Diary;

    @Column()
    status!: boolean;

    @CreateDateColumn({ name: "created_at" })
    created_at!: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updated_at!: Date;
}